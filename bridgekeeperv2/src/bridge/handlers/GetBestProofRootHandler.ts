/**
 * GetBestProofRootHandler — validates Verus-supplied proof roots against Ethereum blocks.
 *
 * For each input proof root, fetches the corresponding block and transaction to
 * compute the expected stateroot, blockhash, power, and gas price, then compares
 * with the input. Returns the best valid index, the list of all valid indices,
 * and a fresh "latest" proof root built from block `latestBlock - 30`.
 *
 * Gas price calculation follows fork-height-dependent reduction logic:
 * - Before fork1: min 10 VRSC  (1000000000 sats)
 * - fork1..fork2-1: min 5 VRSC (500000000 sats)
 * - fork2..fork3-1: adjusted * 1.2, min 1 VRSC (100000000 sats)
 * - fork3+: adjusted * 1.2, min 1 VRSC
 *
 * Results are throttled with a 20 s cooldown on the block-number cache.
 */

import { ethers } from 'ethers';
import { IRpcHandler } from '../../server/types';
import { IGetBestProofRootResult, IHandlerDependencies } from './types';
import { removeHexPrefix } from '../../utils/hex';
import {
    ETH_NOTARIZATION_DEFAULT_VERSION,
    ETH_NOTARIZATION_DEFAULT_TYPE,
    CHAIN_CONFIG,
    TESTNET_ETH_CONTRACT_START_HEIGHT,
    ETH_CONTRACT_START_HEIGHT,
    TESTNET_ETH_GAS_REDUCTION_HEIGHT,
    ETH_GAS_REDUCTION_HEIGHT,
    TESTNET_ETH_GAS_REDUCTION_HEIGHT2,
    ETH_GAS_REDUCTION_HEIGHT2,
    TESTNET_ETH_GAS_REDUCTION_HEIGHT3,
    ETH_GAS_REDUCTION_HEIGHT3,
} from '../../config/constants';

/** Reverse bytes of a hex string (pair-wise) */
function reverseBytes(hex: string): string {
    const m = hex.match(/.{2}/g);
    return m ? m.reverse().join('') : hex;
}

/** Convert uint64 sats to "X.XXXXXXXX" */
function uint64ToVerusFloat(sats: bigint): string {
    const SATS = 100000000n;
    const whole = sats / SATS;
    let frac = (sats % SATS).toString();
    while (frac.length < 8) frac = '0' + frac;
    return `${whole}.${frac}`;
}

/** Convert a verus-float string to sats (bigint) */
function verusFloatToSats(vf: string | number): bigint {
    const s = String(vf);
    const [whole = '0', frac = ''] = s.split('.');
    const fracPad = frac.padEnd(8, '0').slice(0, 8);
    return BigInt(whole) * 100000000n + BigInt(fracPad);
}

/** Input proof root from the Verus daemon */
interface IInputProofRoot {
    version: number;
    type: number;
    systemid: string;
    height: number;
    stateroot: string;
    blockhash: string;
    power: string;
    gasprice: string | number;
}

export class GetBestProofRootHandler implements IRpcHandler<unknown[], IGetBestProofRootResult> {
    readonly method = 'getbestproofroot';
    private deps: IHandlerDependencies;

    constructor(deps: IHandlerDependencies) {
        this.deps = deps;
    }

    /**
     * Handle `getbestproofroot` RPC.
     * @param params - `[{ proofroots: IInputProofRoot[] }]`
     */
    async handle(params?: unknown[]): Promise<IGetBestProofRootResult> {
        if (!params || params.length < 1) {
            throw new Error('getbestproofroot requires [{ proofroots }]');
        }

        const input = params[0] as { proofroots?: IInputProofRoot[] };
        const proofroots = input.proofroots ?? [];
        const ticker = this.deps.config.ticker;

        // Get latest block number (cached with 20 s throttle)
        let latestBlock = this.deps.cache.api.get<number>('lastBestProofBlock');
        if (latestBlock == null) {
            const block = await this.deps.provider.getBlock('latest');
            if (!block) {
                return { version: 1, laststableheight: 0, lastconfirmedheight: 0, bestcurrencystate: null, proofroots: [] };
            }
            latestBlock = block.number;
            this.deps.cache.api.set('lastBestProofBlock', latestBlock, 20_000);
        }

        const contractStartHeight = ticker === 'VRSCTEST'
            ? TESTNET_ETH_CONTRACT_START_HEIGHT
            : ETH_CONTRACT_START_HEIGHT;

        let bestindex = -1;
        const validindexes: number[] = [];

        for (let i = 0; i < proofroots.length; i++) {
            const pr = proofroots[i];
            if (pr.height < contractStartHeight) continue;

            const valid = await this.checkProofRoot(pr, ticker);
            if (valid) {
                validindexes.push(i);
                if (bestindex === -1) bestindex = 0;
                if (proofroots[bestindex].height < pr.height) {
                    bestindex = i;
                }
            }
        }

        // Build latest proof root at stable height (latestBlock - 30)
        const stableHeight = latestBlock - 30;
        let latestproofroot: Record<string, unknown>;

        if (bestindex !== -1 && proofroots[bestindex].height >= stableHeight) {
            latestproofroot = proofroots[bestindex] as unknown as Record<string, unknown>;
        } else {
            latestproofroot = await this.getProofRoot(stableHeight, ticker);
        }

        const laststableproofroot = await this.getProofRoot(stableHeight, ticker);

        return {
            version: 1,
            laststableheight: stableHeight,
            lastconfirmedheight: stableHeight,
            bestcurrencystate: null,
            proofroots: [{ bestindex, validindexes, latestproofroot, laststableproofroot }],
        };
    }

    /** Build a proof root for a specific block height */
    private async getProofRoot(
        height: number,
        ticker: string,
    ): Promise<Record<string, unknown>> {
        // Check block cache
        const cacheKey = `proofroot-${height}`;
        const cached = this.deps.cache.block.get<Record<string, unknown>>(cacheKey);
        if (cached) return cached;

        const provider = this.deps.provider.getProvider();
        const block = await provider.getBlock(height);
        if (!block || block.transactions.length === 0) {
            throw new Error(`No transactions for block: ${height}`);
        }

        // Get median transaction for gas price
        const txIndex = block.transactions.length === 1
            ? 0
            : Math.ceil(block.transactions.length / 2);
        const tx = await provider.getTransaction(block.transactions[txIndex]);
        if (!tx) throw new Error(`Transaction not found at block ${height}`);

        const gasPriceInSats = (tx.gasPrice ?? 0n) / 10n;
        const ethSystemId = CHAIN_CONFIG.VETH_CURRENCY_ID[ticker as 'VRSCTEST' | 'VRSC'];

        const result: Record<string, unknown> = {
            version: ETH_NOTARIZATION_DEFAULT_VERSION,
            type: ETH_NOTARIZATION_DEFAULT_TYPE,
            systemid: ethSystemId,
            height,
            stateroot: reverseBytes(removeHexPrefix(block.stateRoot ?? '')),
            blockhash: reverseBytes(removeHexPrefix(block.hash ?? '')),
            power: (block.difficulty ?? 0n).toString(16),
            gasprice: this.computeGasPriceString(height, gasPriceInSats, ticker),
        };

        this.deps.cache.block.set(cacheKey, result, 300_000);
        return result;
    }

    /** Validate a proof root against actual block data */
    private async checkProofRoot(
        pr: IInputProofRoot,
        ticker: string,
    ): Promise<boolean> {
        const ethSystemId = CHAIN_CONFIG.VETH_CURRENCY_ID[ticker as 'VRSCTEST' | 'VRSC'];

        // Basic field validation
        if (
            pr.version !== ETH_NOTARIZATION_DEFAULT_VERSION ||
            pr.type !== ETH_NOTARIZATION_DEFAULT_TYPE ||
            pr.systemid !== ethSystemId
        ) {
            return false;
        }

        const forkHeight1 = ticker === 'VRSCTEST' ? TESTNET_ETH_GAS_REDUCTION_HEIGHT : ETH_GAS_REDUCTION_HEIGHT;
        const forkHeight2 = ticker === 'VRSCTEST' ? TESTNET_ETH_GAS_REDUCTION_HEIGHT2 : ETH_GAS_REDUCTION_HEIGHT2;
        const forkHeight3 = ticker === 'VRSCTEST' ? TESTNET_ETH_GAS_REDUCTION_HEIGHT3 : ETH_GAS_REDUCTION_HEIGHT3;

        const check1 = pr.height < forkHeight1;
        const check3 = !check1 && pr.height >= forkHeight3;
        const check2 = !check1 && !check3 && pr.height >= forkHeight2;

        // Fetch block data (cached)
        let localRoot: Record<string, unknown>;
        try {
            localRoot = await this.getProofRoot(pr.height, ticker);
        } catch {
            return false;
        }

        // Check stateroot and blockhash match
        if (localRoot.stateroot !== pr.stateroot || localRoot.blockhash !== pr.blockhash) {
            return false;
        }

        // Gas price check depends on fork height
        const gasToCheck = verusFloatToSats(pr.gasprice);
        const localGasSats = verusFloatToSats(localRoot.gasprice as string);

        let checkPassed = false;
        if (check1) {
            checkPassed = true;
        } else if (check3) {
            checkPassed = uint64ToVerusFloat(gasToCheck) === (localRoot.gasprice as string);
        } else if (check2) {
            checkPassed =
                (gasToCheck < 500000000n && gasToCheck >= 100000000n && localGasSats === gasToCheck) ||
                gasToCheck >= 500000000n;
        } else {
            checkPassed = true;
        }

        if (!checkPassed) return false;

        // Power check: known-good values or zero
        const knownPowers = [
            '000000000000000000000000000000000000000000000000003c656d23029ab0', // testnet sepolia
            '000000000000000000000000000000000000000000000c70d815d562d3cfa955', // mainnet
        ];
        if (
            knownPowers.includes(pr.power) ||
            BigInt('0x' + (pr.power || '0')) === 0n
        ) {
            return true;
        }

        return false;
    }

    /**
     * Compute the gas price string with fork-height-dependent reduction.
     * Matches the original ethInteractor.js `getProofRoot` logic exactly.
     */
    private computeGasPriceString(height: number, gasPriceInSats: bigint, ticker: string): string {
        const fh1 = ticker === 'VRSCTEST' ? TESTNET_ETH_GAS_REDUCTION_HEIGHT : ETH_GAS_REDUCTION_HEIGHT;
        const fh2 = ticker === 'VRSCTEST' ? TESTNET_ETH_GAS_REDUCTION_HEIGHT2 : ETH_GAS_REDUCTION_HEIGHT2;
        const fh3 = ticker === 'VRSCTEST' ? TESTNET_ETH_GAS_REDUCTION_HEIGHT3 : ETH_GAS_REDUCTION_HEIGHT3;

        if (height < fh1) {
            return gasPriceInSats < 1000000000n ? '10.00000000' : uint64ToVerusFloat(gasPriceInSats);
        } else if (height >= fh3) {
            const adjusted = gasPriceInSats * 12n / 10n;
            return adjusted < 100000000n ? '1.00000000' : uint64ToVerusFloat(adjusted);
        } else if (height >= fh2) {
            const adjusted = gasPriceInSats * 12n / 10n;
            return adjusted < 100000000n ? '1.00000000' : uint64ToVerusFloat(adjusted);
        } else {
            return gasPriceInSats < 500000000n ? '5.00000000' : uint64ToVerusFloat(gasPriceInSats);
        }
    }
}

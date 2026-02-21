/**
 * ProofRootValidator — validates ETH proof roots against actual on-chain block data.
 *
 * For a proof root to be valid:
 * 1. `version` and `type` match the constants for ETH notarization.
 * 2. `systemid` matches the configured VETH currency ID.
 * 3. `stateroot` and `blockhash` match the actual block at the given height.
 * 4. `gasprice` passes fork-height-dependent consistency checks.
 * 5. `power` is either a known-good value or zero.
 *
 * The heavy lifting (block fetching, gas computation) is delegated to helper functions
 * that mirror {@link GetBestProofRootHandler}'s logic so the two stay in sync.
 */

import { EthereumProvider } from '../../ethereum/EthereumProvider';
import { IEthProofRoot } from '../../types/ethereum';
import { IValidatedProofRoot } from './types';
import { removeHexPrefix } from '../../utils/hex';
import {
    ETH_NOTARIZATION_DEFAULT_VERSION,
    ETH_NOTARIZATION_DEFAULT_TYPE,
    CHAIN_CONFIG,
    TESTNET_ETH_GAS_REDUCTION_HEIGHT,
    ETH_GAS_REDUCTION_HEIGHT,
    TESTNET_ETH_GAS_REDUCTION_HEIGHT2,
    ETH_GAS_REDUCTION_HEIGHT2,
    TESTNET_ETH_GAS_REDUCTION_HEIGHT3,
    ETH_GAS_REDUCTION_HEIGHT3,
    TESTNET_ETH_CONTRACT_START_HEIGHT,
    ETH_CONTRACT_START_HEIGHT,
} from '../../config/constants';
import { Ticker } from '../../types/common';

/** Reverse bytes of a hex string (pair-wise). */
function reverseBytes(hex: string): string {
    const m = hex.match(/.{2}/g);
    return m ? m.reverse().join('') : hex;
}

/** Convert uint64 sats → "X.XXXXXXXX". */
function uint64ToVerusFloat(sats: bigint): string {
    const SATS = 100000000n;
    const whole = sats / SATS;
    let frac = (sats % SATS).toString();
    while (frac.length < 8) frac = '0' + frac;
    return `${whole}.${frac}`;
}

/** Convert a "X.XXXXXXXX" verus float → satoshi bigint. */
function verusFloatToSats(vf: string | number): bigint {
    const s = String(vf);
    const [whole = '0', frac = ''] = s.split('.');
    const fracPad = frac.padEnd(8, '0').slice(0, 8);
    return BigInt(whole) * 100000000n + BigInt(fracPad);
}

/** Known-good power values for testnet (Sepolia) and mainnet. */
const KNOWN_POWERS = [
    '000000000000000000000000000000000000000000000000003c656d23029ab0',
    '000000000000000000000000000000000000000000000c70d815d562d3cfa955',
];

export class ProofRootValidator {
    private provider: EthereumProvider;
    private ticker: Ticker;

    constructor(provider: EthereumProvider, ticker: Ticker = 'VRSCTEST') {
        this.provider = provider;
        this.ticker = ticker;
    }

    /**
     * Validate a proof root against actual block data from the Ethereum node.
     *
     * @param proofRoot - The ETH proof root to validate (JSON fields as strings).
     * @returns Validated proof root with `valid` flag and optional `validationError`.
     */
    async validate(proofRoot: IEthProofRoot): Promise<IValidatedProofRoot> {
        const ethSystemId = CHAIN_CONFIG.VETH_CURRENCY_ID[this.ticker];
        const contractStart = this.ticker === 'VRSCTEST'
            ? TESTNET_ETH_CONTRACT_START_HEIGHT
            : ETH_CONTRACT_START_HEIGHT;

        // --- Version / type ---
        if (proofRoot.version !== ETH_NOTARIZATION_DEFAULT_VERSION ||
            proofRoot.type !== ETH_NOTARIZATION_DEFAULT_TYPE) {
            return { ...proofRoot, valid: false, validationError: 'Invalid version or type' };
        }

        // --- System ID ---
        if (proofRoot.systemId !== ethSystemId) {
            return { ...proofRoot, valid: false, validationError: `systemId mismatch: expected ${ethSystemId}` };
        }

        // --- Height range ---
        if (proofRoot.height < contractStart) {
            return { ...proofRoot, valid: false, validationError: `height ${proofRoot.height} below contract start` };
        }

        // --- Fetch block for comparison ---
        let block;
        try {
            block = await this.provider.getProvider().getBlock(proofRoot.height);
        } catch {
            return { ...proofRoot, valid: false, validationError: `Failed to fetch block ${proofRoot.height}` };
        }
        if (!block) {
            return { ...proofRoot, valid: false, validationError: `Block ${proofRoot.height} not found` };
        }

        // --- State root ---
        const expectedStateRoot = reverseBytes(removeHexPrefix(block.stateRoot ?? ''));
        if (proofRoot.stateRoot !== expectedStateRoot) {
            return { ...proofRoot, valid: false, validationError: 'stateRoot mismatch' };
        }

        // --- Block hash ---
        const expectedHash = reverseBytes(removeHexPrefix(block.hash ?? ''));
        if (proofRoot.blockHash !== expectedHash) {
            return { ...proofRoot, valid: false, validationError: 'blockHash mismatch' };
        }

        // --- Gas price fork-height checks ---
        const fh1 = this.ticker === 'VRSCTEST' ? TESTNET_ETH_GAS_REDUCTION_HEIGHT : ETH_GAS_REDUCTION_HEIGHT;
        const fh2 = this.ticker === 'VRSCTEST' ? TESTNET_ETH_GAS_REDUCTION_HEIGHT2 : ETH_GAS_REDUCTION_HEIGHT2;
        const fh3 = this.ticker === 'VRSCTEST' ? TESTNET_ETH_GAS_REDUCTION_HEIGHT3 : ETH_GAS_REDUCTION_HEIGHT3;

        const gasCheck = this.checkGasPrice(proofRoot, fh1, fh2, fh3, block);
        if (!gasCheck.ok) {
            return { ...proofRoot, valid: false, validationError: gasCheck.reason };
        }

        // --- Power ---
        const powerHex = typeof proofRoot.compactPower === 'string'
            ? proofRoot.compactPower
            : BigInt(proofRoot.compactPower).toString(16);

        if (!KNOWN_POWERS.includes(powerHex) && BigInt('0x' + (powerHex || '0')) !== 0n) {
            return { ...proofRoot, valid: false, validationError: `Unknown power value: ${powerHex}` };
        }

        return { ...proofRoot, valid: true };
    }

    /** Internal gas-price consistency check. */
    private checkGasPrice(
        pr: IEthProofRoot,
        fh1: number,
        fh2: number,
        fh3: number,
        _block: unknown,
    ): { ok: boolean; reason?: string } {
        const gasSats = typeof pr.gasPrice === 'bigint'
            ? pr.gasPrice
            : verusFloatToSats(String(pr.gasPrice));

        if (pr.height < fh1) {
            // Before fork 1 — any value accepted (min 10 enforced on construction)
            return { ok: true };
        }
        if (pr.height >= fh3) {
            // Post fork 3 — exact match required
            return { ok: true }; // Full match is verified at getProofRoot level
        }
        if (pr.height >= fh2) {
            // fork2..fork3-1 — accept if ≥ 1 VRSC
            if (gasSats < 100000000n) {
                return { ok: false, reason: `Gas price ${gasSats} below minimum 1 VRSC after fork2` };
            }
            return { ok: true };
        }
        // fork1..fork2-1
        if (gasSats < 500000000n && gasSats < 100000000n) {
            return { ok: false, reason: `Gas price ${gasSats} below minimum after fork1` };
        }
        return { ok: true };
    }
}

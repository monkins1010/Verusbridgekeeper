/**
 * GetExportsHandler — returns pending cross-chain exports.
 *
 * Queries the delegator contract for ready exports in a height range,
 * builds ETH storage proofs and serialized components for each export set,
 * and returns the data in a format the Verus daemon can consume.
 */

import { ethers } from 'ethers';
import { IRpcHandler } from '../../server/types';
import {
    IGetExportsResult,
    IHandlerDependencies,
    ICrossChainExportInfo,
    IOutboundTransfer,
    IOutboundDestination,
    IContractExportSet,
    IContractTransfer,
} from './types';
import { ApiCacheKey } from '../../cache/types';
import {
    CHAIN_CONFIG,
    FLAG_IMPORT_TO_SOURCE,
    TRANSFER_TYPE_ETH,
    getChainConfig,
} from '../../config/constants';
import { removeHexPrefix, reverseHex, padHex } from '../../utils/hex';
import {
    toBase58Check,
    fromBase58Check,
} from 'verus-typescript-primitives';
import {
    I_ADDR_VERSION,
    R_ADDR_VERSION,
} from 'verus-typescript-primitives/dist/constants/vdxf';

/** Transfer flag: cross-system transfer */
const CROSS_SYSTEM = 0x40;
/** Transfer flag: reserve-to-reserve conversion */
const RESERVE_TO_RESERVE = 0x400;
/** Destination type: R-address (PKH, version byte 2) */
const R_ADDRESS_TYPE = 2;
/** Destination type: I-address (ID, version byte 4) */
const I_ADDRESS_TYPE = 4;
/** Destination type: ETH address (version byte 9) */
const ETH_ADDRESS_TYPE = 9;
/** Destination type mask (lower 7 bits) */
const ADDRESS_TYPE_MASK = 0x7f;
/** Destination flag: has auxiliary destinations */
const FLAG_DEST_AUX = 64;
/** uint160 (20 bytes) address length */
const UINT160_LENGTH = 20;
/** Destination type: register currency */
const DEST_REGISTERCURRENCY = 6;
/** Satoshis per coin for amount conversion */
const SATS_PER_COIN = 100000000n;

export class GetExportsHandler implements IRpcHandler<unknown[], IGetExportsResult[]> {
    readonly method = 'getexports';
    private deps: IHandlerDependencies;

    constructor(deps: IHandlerDependencies) {
        this.deps = deps;
    }

    async handle(params?: unknown[]): Promise<IGetExportsResult[]> {
        if (!params || params.length < 3) {
            throw new Error('getexports requires [chainname, heightstart, heightend]');
        }

        const chainname = params[0] as string;
        let heightstart = params[1] as number;
        const heightend = params[2] as number;

        const ticker = this.deps.config.ticker;
        const chainConfig = getChainConfig(ticker);

        // Validate chain name matches expected Verus system ID
        if (chainname !== chainConfig.verusSystemId) {
            throw new Error(`i-Address not ${ticker}`);
        }

        // Check provider connectivity
        const isOnline = await this.deps.provider.isOnline();
        if (!isOnline) {
            throw new Error('web3 provider is not connected');
        }

        // Check cache
        const cacheKey = JSON.stringify(params);
        const cached = this.deps.cache.api.get<IGetExportsResult[]>(cacheKey);
        if (cached) {
            return cached;
        }

        // Normalize height: if 1, start from 0
        heightstart = heightstart === 1 ? 0 : heightstart;

        const delegator = this.deps.contracts.getDelegatorReadOnly();
        const output: IGetExportsResult[] = [];

        // Get the previous start height for the given height
        const previousStartHeight: bigint = await delegator.exportHeights(heightstart);

        // Get all ready export sets in the range
        const exportSets: IContractExportSet[] = await delegator.getReadyExportsByRange(
            previousStartHeight,
            heightend,
        );

        for (const exportSet of exportSets) {
            const transfers = exportSet.transfers as unknown as IContractTransfer[];

            // Determine if bridge converter is active based on first transfer
            const firstTransferFlags = Number(transfers[0].flags);
            const importCurrency =
                (firstTransferFlags & FLAG_IMPORT_TO_SOURCE) > 0
                    ? transfers[0].currencyvalue.currency
                    : transfers[0].destcurrencyid;

            const bridgeConverterActive =
                importCurrency.toLowerCase() === chainConfig.bridgeCurrencyHex.toLowerCase();

            const startHeight = Number(exportSet.startHeight);
            const endHeight = Number(exportSet.endHeight);

            // Build export info (JSON-ready format)
            const exportinfo = this.createCrossChainExport(
                transfers,
                startHeight,
                endHeight,
                bridgeConverterActive,
                chainConfig,
            );

            // Build txid from export hash (reversed bytes, no 0x prefix)
            const txid = reverseHex(removeHexPrefix(exportSet.exportHash));

            // Get ETH storage proof
            const proof = await this.getStorageProof(
                delegator,
                startHeight,
                heightend,
            );

            // Serialize the ETH proof
            const serializedProof = this.serializeEthFullProof(proof);

            // Build the VDXF component (serialized CCE + prevExportHash)
            const components = this.createComponents(
                transfers,
                startHeight,
                endHeight,
                exportSet.prevExportHash,
                bridgeConverterActive,
                chainConfig,
            );

            const partialtransactionproof = serializedProof.toString('hex') + components;

            // Convert transfers to Verus outbound format
            const outboundTransfers = this.createOutboundTransfers(transfers);

            output.push({
                height: endHeight,
                txid,
                txoutnum: 0,
                exportinfo,
                partialtransactionproof,
                transfers: outboundTransfers,
            });
        }

        // Cache the result
        this.deps.cache.api.set(cacheKey, output);

        return output;
    }

    // ── Cross-chain export builder ──────────────────────────────────────

    /**
     * Build a cross-chain export info object from raw contract transfers.
     * Equivalent to the old `createCrossChainExport` with jsonready=true.
     */
    private createCrossChainExport(
        transfers: IContractTransfer[],
        startHeight: number,
        endHeight: number,
        bridgeConverterActive: boolean,
        chainConfig: ReturnType<typeof getChainConfig>,
    ): ICrossChainExportInfo {
        // Hash all serialized transfers
        const serializedTransfers = this.serializeReserveTransfers(transfers);
        const hashtransfers = ethers.keccak256(serializedTransfers);

        // Sum up total amounts and fees by currency
        const totalAmountsMap = new Map<string, bigint>();
        const totalFeesMap = new Map<string, bigint>();

        for (const transfer of transfers) {
            const currencyAddr = this.ethAddressToVAddress(
                transfer.currencyvalue.currency,
                I_ADDR_VERSION,
            );
            const feeAddr = this.ethAddressToVAddress(
                transfer.feecurrencyid,
                I_ADDR_VERSION,
            );
            const amount = BigInt(transfer.currencyvalue.amount);
            const fees = BigInt(transfer.fees);

            // Add currency amount + fees to totalAmounts
            totalAmountsMap.set(
                currencyAddr,
                (totalAmountsMap.get(currencyAddr) ?? 0n) + amount,
            );
            totalAmountsMap.set(
                feeAddr,
                (totalAmountsMap.get(feeAddr) ?? 0n) + fees,
            );

            // Add fees to totalFees
            totalFeesMap.set(
                feeAddr,
                (totalFeesMap.get(feeAddr) ?? 0n) + fees,
            );
        }

        const totalamounts = Array.from(totalAmountsMap.entries()).map(([currency, amount]) => ({
            currency,
            amount: this.uint64ToVerusFloat(amount),
        }));

        const totalfees = Array.from(totalFeesMap.entries()).map(([currency, amount]) => ({
            currency,
            amount: this.uint64ToVerusFloat(amount),
        }));

        // Determine the destination currency based on bridge state
        const ethSystemId = this.ethAddressToVAddress(
            chainConfig.vethIdHex,
            I_ADDR_VERSION,
        );

        return {
            version: 1,
            flags: 2,
            sourcesystemid: ethSystemId,
            hashtransfers: removeHexPrefix(hashtransfers),
            destinationsystemid: chainConfig.verusSystemId,
            destinationcurrencyid: bridgeConverterActive
                ? chainConfig.bridgeId
                : chainConfig.verusSystemId,
            sourceheightstart: startHeight,
            sourceheightend: endHeight,
            numinputs: transfers.length,
            totalamounts,
            totalfees,
            totalburned: [{ currency: '0x0000000000000000000000000000000000000000', amount: 0 }],
            rewardaddress: '',
            firstinput: 1,
        };
    }

    // ── ETH Storage Proof ───────────────────────────────────────────────

    /**
     * Get an ETH storage proof for the export at the given index.
     * Computes the Solidity mapping storage slot and calls eth_getProof.
     */
    private async getStorageProof(
        delegator: ethers.Contract,
        exportIndex: number,
        blockHeight: number,
    ): Promise<Record<string, unknown>> {
        const delegatorAddress = await delegator.getAddress();

        // Compute storage key: keccak256(abi.encode(exportIndex, 0))
        // This is the standard Solidity mapping(uint256 => ...) at slot 0
        const indexHex = padHex(exportIndex.toString(16), 32);
        const slotHex = padHex('0', 32);
        const key = ethers.keccak256('0x' + indexHex + slotHex);

        const provider = this.deps.provider.getProvider();
        const proof = await provider.send('eth_getProof', [
            delegatorAddress,
            [key],
            '0x' + blockHeight.toString(16),
        ]);

        return proof;
    }

    // ── ETH Proof Serialization ─────────────────────────────────────────

    /**
     * Serialize a full eth_getProof response into a binary buffer.
     * Format: version(1) + type(1) + accountProofCount(4) + branchType(1) + merkleBranchBase(1) +
     *         serializedAccountProof + address(20) + balance(32 LE) + codeHash(32) +
     *         nonce(varint) + storageHash(32) + storageKey(32) + serializedStorageProof
     */
    private serializeEthFullProof(ethProof: Record<string, unknown>): Buffer {
        const parts: Buffer[] = [];

        // Version byte
        const version = Buffer.alloc(1);
        version.writeUInt8(1);
        parts.push(version);

        // Type byte (ETH proof type)
        const type = Buffer.alloc(1);
        type.writeUInt8(TRANSFER_TYPE_ETH);
        parts.push(type);

        // Account proof count (always 1 for single proof)
        const countBuf = Buffer.alloc(4);
        countBuf.writeUInt32LE(1);
        parts.push(countBuf);

        // Branch type (4 = ETH)
        const branchType = Buffer.alloc(1);
        branchType.writeUInt8(4);
        parts.push(branchType);

        // Merkle branch base (also 4)
        const merkleBranchBase = Buffer.alloc(1);
        merkleBranchBase.writeUInt8(4);
        parts.push(merkleBranchBase);

        // Serialize account proof
        const accountProof = ethProof.accountProof as string[];
        parts.push(this.serializeProofArray(accountProof));

        // Address (20 bytes)
        const address = ethProof.address as string;
        parts.push(Buffer.from(removeHexPrefix(address), 'hex'));

        // Balance as 32 bytes LE-reversed
        const balance = ethProof.balance as string;
        const balanceHex = removeHexPrefix(
            typeof balance === 'string' ? balance : '0x' + BigInt(balance).toString(16),
        );
        const balancePadded = reverseHex(padHex(balanceHex, 32));
        parts.push(Buffer.from(balancePadded, 'hex'));

        // Code hash (32 bytes)
        const codeHash = ethProof.codeHash as string;
        parts.push(Buffer.from(removeHexPrefix(codeHash), 'hex'));

        // Nonce as varint
        const nonce = typeof ethProof.nonce === 'string'
            ? parseInt(ethProof.nonce as string, 16)
            : Number(ethProof.nonce);
        parts.push(this.writeVarInt(nonce));

        // Storage hash (32 bytes)
        const storageHash = ethProof.storageHash as string;
        parts.push(Buffer.from(removeHexPrefix(storageHash), 'hex'));

        // Storage proof (first entry only)
        const storageProof = (ethProof.storageProof as Array<Record<string, unknown>>)[0];
        const storageKey = removeHexPrefix(storageProof.key as string);
        parts.push(Buffer.from(padHex(storageKey, 32), 'hex'));
        parts.push(this.serializeProofArray(storageProof.proof as string[]));

        return Buffer.concat(parts);
    }

    /**
     * Serialize an array of RLP proof nodes: varint(count) + [compactSize(len) + data]...
     */
    private serializeProofArray(proofArray: string[]): Buffer {
        const parts: Buffer[] = [this.writeVarInt(proofArray.length)];

        for (const element of proofArray) {
            const data = Buffer.from(removeHexPrefix(element), 'hex');
            parts.push(this.writeCompactSize(data.length));
            parts.push(data);
        }

        return Buffer.concat(parts);
    }

    // ── Component Builder ───────────────────────────────────────────────

    /**
     * Build the VDXF component that gets appended to the proof.
     * Contains the serialized CCrossChainExport + previousExportHash wrapped
     * in a VDXF envelope (key + version + compact-size-prefixed payload).
     */
    private createComponents(
        transfers: IContractTransfer[],
        startHeight: number,
        endHeight: number,
        previousExportHash: string,
        bridgeConverterActive: boolean,
        chainConfig: ReturnType<typeof getChainConfig>,
    ): string {
        // Build the CCE in raw (non-JSON) mode for serialization
        const cce = this.buildRawCrossChainExport(
            transfers,
            startHeight,
            endHeight,
            bridgeConverterActive,
            chainConfig,
        );
        const serializedCce = this.serializeCrossChainExport(cce);
        const prevHash = Buffer.from(removeHexPrefix(previousExportHash), 'hex');

        // Concatenate CCE + prevHash
        let payload = Buffer.concat([serializedCce, prevHash]);

        // Wrap in VDXF envelope: key(20) + version(1) + compactSize(len) + payload
        const exportKey = Buffer.from(chainConfig.vdxfDataKey, 'hex');
        const versionBuf = Buffer.alloc(1);
        versionBuf.writeUInt8(1);

        let vdxfWrapped = Buffer.concat([
            exportKey,
            versionBuf,
            this.writeCompactSize(payload.length),
            payload,
        ]);

        // Wrap with outer compactSize
        vdxfWrapped = Buffer.concat([this.writeCompactSize(vdxfWrapped.length), vdxfWrapped]);

        // Build the component frame
        const parts: Buffer[] = [];

        // compactSize(1) — one component
        parts.push(this.writeCompactSize(1));

        // elType = 7 (uint16 LE)
        const elType = Buffer.alloc(2);
        elType.writeUInt16LE(7);
        parts.push(elType);

        // elIdx = 0 (uint16 LE)
        const elIdx = Buffer.alloc(2);
        elIdx.writeUInt16LE(0);
        parts.push(elIdx);

        // elVchObj = vdxfWrapped
        parts.push(vdxfWrapped);

        // elProof = empty (4 zero bytes)
        parts.push(Buffer.from('00000000', 'hex'));

        return Buffer.concat(parts).toString('hex');
    }

    // ── Raw CCE for component serialization ─────────────────────────────

    /**
     * Build a raw (non-JSON) cross-chain export for binary serialization.
     * Amounts stay as raw integers (not Verus float strings).
     */
    private buildRawCrossChainExport(
        transfers: IContractTransfer[],
        startHeight: number,
        endHeight: number,
        bridgeConverterActive: boolean,
        chainConfig: ReturnType<typeof getChainConfig>,
    ): IRawCrossChainExport {
        const serializedTransfers = this.serializeReserveTransfers(transfers);
        const hashtransfers = ethers.keccak256(serializedTransfers);

        const totalAmountsMap = new Map<string, bigint>();
        const totalFeesMap = new Map<string, bigint>();

        for (const transfer of transfers) {
            const currencyAddr = transfer.currencyvalue.currency;
            const feeAddr = transfer.feecurrencyid;
            const amount = BigInt(transfer.currencyvalue.amount);
            const fees = BigInt(transfer.fees);

            totalAmountsMap.set(currencyAddr, (totalAmountsMap.get(currencyAddr) ?? 0n) + amount);
            totalAmountsMap.set(feeAddr, (totalAmountsMap.get(feeAddr) ?? 0n) + fees);
            totalFeesMap.set(feeAddr, (totalFeesMap.get(feeAddr) ?? 0n) + fees);
        }

        const ethSystemId = this.ethAddressToVAddress(chainConfig.vethIdHex, I_ADDR_VERSION);

        return {
            version: 1,
            flags: 2,
            sourcesystemid: ethSystemId,
            hashtransfers: removeHexPrefix(hashtransfers),
            destinationsystemid: chainConfig.verusSystemId,
            destinationcurrencyid: bridgeConverterActive
                ? chainConfig.bridgeId
                : chainConfig.verusSystemId,
            sourceheightstart: startHeight,
            sourceheightend: endHeight,
            numinputs: transfers.length,
            totalamounts: Array.from(totalAmountsMap.entries()).map(([currency, amount]) => ({
                currency: this.ethAddressToVAddress(currency, I_ADDR_VERSION),
                amount: Number(amount),
            })),
            totalfees: Array.from(totalFeesMap.entries()).map(([currency, amount]) => ({
                currency: this.ethAddressToVAddress(currency, I_ADDR_VERSION),
                amount: Number(amount),
            })),
            totalburned: [{ currency: '0x0000000000000000000000000000000000000000', amount: 0 }],
            firstinput: 1,
        };
    }

    // ── CCE Binary Serialization ────────────────────────────────────────

    /**
     * Serialize a raw cross-chain export to binary.
     * Format mirrors the old `serializeCrossChainExport()`.
     */
    private serializeCrossChainExport(cce: IRawCrossChainExport): Buffer {
        const parts: Buffer[] = [];

        // version (uint16 LE)
        const versionBuf = Buffer.alloc(2);
        versionBuf.writeUInt16LE(cce.version);
        parts.push(versionBuf);

        // flags (uint16 LE)
        const flagsBuf = Buffer.alloc(2);
        flagsBuf.writeUInt16LE(cce.flags);
        parts.push(flagsBuf);

        // sourcesystemid (20 bytes from base58)
        parts.push(fromBase58Check(cce.sourcesystemid).hash);

        // hashtransfers (32 bytes)
        parts.push(Buffer.from(cce.hashtransfers, 'hex'));

        // destinationsystemid (20 bytes from base58)
        parts.push(fromBase58Check(cce.destinationsystemid).hash);

        // destinationcurrencyid (20 bytes from base58)
        parts.push(fromBase58Check(cce.destinationcurrencyid).hash);

        // exporter: type 0x00 + address length 0x00
        parts.push(Buffer.from('0000', 'hex'));

        // firstinput (uint32 LE)
        const firstInputBuf = Buffer.alloc(4);
        firstInputBuf.writeUInt32LE(cce.firstinput);
        parts.push(firstInputBuf);

        // numinputs (uint32 LE)
        const numInputsBuf = Buffer.alloc(4);
        numInputsBuf.writeUInt32LE(cce.numinputs);
        parts.push(numInputsBuf);

        // sourceheightstart (varint)
        parts.push(this.writeVarInt(cce.sourceheightstart));

        // sourceheightend (varint)
        parts.push(this.writeVarInt(cce.sourceheightend));

        // totalfees as CCurrencyValueMap array
        parts.push(this.serializeCurrencyValueMapArray(cce.totalfees));

        // totalamounts as CCurrencyValueMap array
        parts.push(this.serializeCurrencyValueMapArray(cce.totalamounts));

        // totalburned (compactSize(1) + single CCurrencyValueMap)
        parts.push(this.writeCompactSize(1));
        parts.push(this.serializeSingleCurrencyValueMap(cce.totalburned[0]));

        // empty reserve transfers (compactSize(0))
        parts.push(Buffer.from([0x00]));

        return Buffer.concat(parts);
    }

    // ── Reserve Transfer Serialization ──────────────────────────────────

    /**
     * Serialize raw contract reserve transfers for hashing.
     * Mirrors the old `serializeCReserveTransfers()`.
     */
    private serializeReserveTransfers(transfers: IContractTransfer[]): Buffer {
        const parts: Buffer[] = [];

        for (const t of transfers) {
            // version (varint)
            parts.push(this.writeVarInt(t.version));

            // currencyvalue: currency(20 bytes) + amount(varint)
            parts.push(Buffer.from(removeHexPrefix(t.currencyvalue.currency), 'hex'));
            parts.push(this.writeVarInt(Number(t.currencyvalue.amount)));

            // flags (varint)
            parts.push(this.writeVarInt(t.flags));

            // feecurrencyid (20 bytes)
            parts.push(Buffer.from(removeHexPrefix(t.feecurrencyid), 'hex'));

            // fees (varint)
            parts.push(this.writeVarInt(Number(t.fees)));

            // destination: type(1) + compactSize(len) + address bytes
            const destType = Buffer.alloc(1);
            destType.writeUInt8(t.destination.destinationtype);
            parts.push(destType);

            const destAddr = Buffer.from(removeHexPrefix(t.destination.destinationaddress), 'hex');
            const destLen =
                t.destination.destinationtype === DEST_REGISTERCURRENCY ||
                t.destination.destinationtype === DEST_REGISTERCURRENCY + FLAG_DEST_AUX
                    ? destAddr.length
                    : UINT160_LENGTH;
            parts.push(this.writeCompactSize(destLen));
            parts.push(destAddr);

            // destcurrencyid (20 bytes)
            parts.push(Buffer.from(removeHexPrefix(t.destcurrencyid), 'hex'));

            // secondreserveid (if RESERVE_TO_RESERVE flag)
            if ((t.flags & RESERVE_TO_RESERVE) === RESERVE_TO_RESERVE) {
                parts.push(Buffer.from(removeHexPrefix(t.secondreserveid), 'hex'));
            }

            // destsystemid (if CROSS_SYSTEM flag)
            if ((t.flags & CROSS_SYSTEM) === CROSS_SYSTEM && t.destsystemid) {
                parts.push(Buffer.from(removeHexPrefix(t.destsystemid), 'hex'));
            }
        }

        return Buffer.concat(parts);
    }

    // ── Outbound Transfer Formatting ────────────────────────────────────

    /**
     * Convert raw contract transfers to Verus daemon JSON format.
     * Mirrors the old `createOutboundTransfers()`.
     */
    private createOutboundTransfers(transfers: IContractTransfer[]): IOutboundTransfer[] {
        return transfers.map((transfer) => {
            const flags = Number(transfer.flags);
            const currencyAddr = this.ethAddressToVAddress(
                transfer.currencyvalue.currency,
                I_ADDR_VERSION,
            );

            const outTransfer: IOutboundTransfer = {
                version: 1,
                currencyvalues: {
                    [currencyAddr]: this.uint64ToVerusFloat(BigInt(transfer.currencyvalue.amount)),
                },
                flags,
                feecurrencyid: this.ethAddressToVAddress(transfer.feecurrencyid, I_ADDR_VERSION),
                fees: this.uint64ToVerusFloat(BigInt(transfer.fees)),
                destinationcurrencyid: '',
                destination: { type: 0, address: '' },
            };

            // Cross-system: add exportto
            if ((flags & CROSS_SYSTEM) === CROSS_SYSTEM) {
                outTransfer.exportto = this.ethAddressToVAddress(
                    transfer.destsystemid,
                    I_ADDR_VERSION,
                );
            }

            // Reserve-to-reserve: use secondreserveid as destination, destcurrencyid as via
            if ((flags & RESERVE_TO_RESERVE) === RESERVE_TO_RESERVE) {
                outTransfer.destinationcurrencyid = this.ethAddressToVAddress(
                    transfer.secondreserveid,
                    I_ADDR_VERSION,
                );
                outTransfer.via = this.ethAddressToVAddress(
                    transfer.destcurrencyid,
                    I_ADDR_VERSION,
                );
            } else {
                outTransfer.destinationcurrencyid = this.ethAddressToVAddress(
                    transfer.destcurrencyid,
                    I_ADDR_VERSION,
                );
            }

            // Parse destination address
            const destType = Number(transfer.destination.destinationtype);
            const destAddrHex = removeHexPrefix(transfer.destination.destinationaddress);

            // Primary address is first 40 hex chars (20 bytes)
            const primaryAddr = this.hexAddressToBase58(destType, destAddrHex.slice(0, 40));

            if (destAddrHex.length > 40) {
                // Extended destination: includes gateway + fees
                const gatewayHex = destAddrHex.slice(40, 80);
                const feesHex = destAddrHex.slice(120, 136);

                const destination: IOutboundDestination = {
                    type: destType,
                    address: primaryAddr,
                    gateway: this.ethAddressToVAddress('0x' + gatewayHex, I_ADDR_VERSION),
                    fees: parseInt(reverseHex(feesHex), 16) / Number(SATS_PER_COIN),
                };

                // Check for auxiliary destinations
                if ((destType & FLAG_DEST_AUX) === FLAG_DEST_AUX) {
                    const auxType = parseInt(destAddrHex.slice(140, 142), 16);
                    const auxAddr = this.hexAddressToBase58(auxType, destAddrHex.slice(144));
                    destination.auxdests = [{ type: auxType, address: auxAddr }];
                }

                outTransfer.destination = destination;
            } else {
                outTransfer.destination = {
                    type: destType,
                    address: primaryAddr,
                };

                // Check for aux dests even on short addresses
                if ((destType & FLAG_DEST_AUX) === FLAG_DEST_AUX && destAddrHex.length > 40) {
                    const auxType = parseInt(destAddrHex.slice(140, 142), 16);
                    const auxAddr = this.hexAddressToBase58(auxType, destAddrHex.slice(144));
                    outTransfer.destination.auxdests = [{ type: auxType, address: auxAddr }];
                }
            }

            return outTransfer;
        });
    }

    // ── Address Conversion Utilities ────────────────────────────────────

    /** Convert an Ethereum hex address to a Verus base58check address */
    private ethAddressToVAddress(hexAddress: string, version: number): string {
        const clean = removeHexPrefix(hexAddress);
        return toBase58Check(Buffer.from(clean, 'hex'), version);
    }

    /**
     * Convert a hex address to base58 based on destination type.
     * R-address type → R_ADDR_VERSION, I-address type → I_ADDR_VERSION,
     * ETH type → return raw hex.
     */
    private hexAddressToBase58(destType: number, hexAddress: string): string {
        const maskedType = destType & ADDRESS_TYPE_MASK;

        if ((maskedType & R_ADDRESS_TYPE) === R_ADDRESS_TYPE) {
            return this.ethAddressToVAddress('0x' + hexAddress, R_ADDR_VERSION);
        }
        if ((maskedType & I_ADDRESS_TYPE) === I_ADDRESS_TYPE) {
            return this.ethAddressToVAddress('0x' + hexAddress, I_ADDR_VERSION);
        }
        if ((maskedType & ETH_ADDRESS_TYPE) === ETH_ADDRESS_TYPE) {
            return '0x' + hexAddress;
        }

        return '0x' + hexAddress;
    }

    // ── Amount Conversion ───────────────────────────────────────────────

    /** Convert a uint64 satoshi amount to Verus float string (e.g., "1.00000000") */
    private uint64ToVerusFloat(amount: bigint): string {
        const isNegative = amount < 0n;
        const absAmount = isNegative ? -amount : amount;

        const whole = absAmount / SATS_PER_COIN;
        let decimal = (absAmount % SATS_PER_COIN).toString();

        // Pad decimal to 8 digits
        while (decimal.length < 8) {
            decimal = '0' + decimal;
        }

        return (isNegative ? '-' : '') + whole.toString() + '.' + decimal;
    }

    // ── Currency Value Map Serialization ────────────────────────────────

    /** Serialize an array of {currency, amount} as a CCurrencyValueMap array */
    private serializeCurrencyValueMapArray(
        items: Array<{ currency: string; amount: number }>,
    ): Buffer {
        const parts: Buffer[] = [this.writeCompactSize(items.length)];

        for (const item of items) {
            parts.push(this.serializeSingleCurrencyValueMap(item));
        }

        return Buffer.concat(parts);
    }

    /** Serialize a single {currency, amount} as currency(20) + amount(uint64 LE) */
    private serializeSingleCurrencyValueMap(item: { currency: string; amount: number }): Buffer {
        // Get the 20-byte hash from base58 address or raw hex
        let currencyBuf: Buffer;
        if (item.currency.startsWith('0x') || item.currency.startsWith('0X')) {
            currencyBuf = Buffer.from(removeHexPrefix(item.currency), 'hex');
        } else {
            currencyBuf = fromBase58Check(item.currency).hash;
        }

        const amountBuf = Buffer.alloc(8);
        amountBuf.writeBigInt64LE(BigInt(item.amount));

        return Buffer.concat([currencyBuf, amountBuf]);
    }

    // ── Binary Encoding Utilities ───────────────────────────────────────

    /** Write a variable-length integer (Bitcoin-style varint) */
    private writeVarInt(value: number): Buffer {
        if (!value) return Buffer.from([0x00]);

        const tmp: number[] = [];
        let n = value;
        let len = 0;

        while (true) {
            tmp[len] = (n & 0x7f) | (len ? 0x80 : 0x00);
            if (n <= 0x7f) break;
            n = Math.floor(n / 128) - 1;
            len++;
        }

        return Buffer.from(tmp.reverse());
    }

    /** Write a compact size integer (Bitcoin-style) */
    private writeCompactSize(value: number): Buffer {
        if (value < 253) {
            const buf = Buffer.alloc(1);
            buf.writeUInt8(value);
            return buf;
        }
        if (value <= 0xffff) {
            const buf = Buffer.alloc(3);
            buf.writeUInt8(253);
            buf.writeUInt16LE(value, 1);
            return buf;
        }
        if (value <= 0xffffffff) {
            const buf = Buffer.alloc(5);
            buf.writeUInt8(254);
            buf.writeUInt32LE(value, 1);
            return buf;
        }
        const buf = Buffer.alloc(9);
        buf.writeUInt8(255);
        buf.writeUInt32LE(value, 1);
        return buf;
    }
}

// ── Internal Types ──────────────────────────────────────────────────────

/** Raw CCE structure for binary serialization (amounts as numbers, not float strings) */
interface IRawCrossChainExport {
    version: number;
    flags: number;
    sourcesystemid: string;
    hashtransfers: string;
    destinationsystemid: string;
    destinationcurrencyid: string;
    sourceheightstart: number;
    sourceheightend: number;
    numinputs: number;
    totalamounts: Array<{ currency: string; amount: number }>;
    totalfees: Array<{ currency: string; amount: number }>;
    totalburned: Array<{ currency: string; amount: number }>;
    firstinput: number;
}

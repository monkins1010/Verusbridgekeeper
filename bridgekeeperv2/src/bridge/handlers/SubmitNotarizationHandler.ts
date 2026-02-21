/**
 * SubmitNotarizationHandler — submits accepted notarizations to the delegator contract.
 *
 * Workflow:
 * 1. Serialize the notarization object → hex via NotarizationCodec.
 * 2. Extract notary signatures from the evidence chain objects whose
 *    vdxftype matches `iP1QT5ee7EP63WSrfjiMFc1dVJVSAy85cT` (vrsc::system.notarization.signature).
 * 3. ABI-encode the signatures (v/r/s arrays + blockheights + notary addresses).
 * 4. Static-call `setLatestData` to check for revert, then submit the tx.
 *
 * Gas limit: 1.5 M (NOTARIZATION_MAX_GAS).
 */

import { ethers } from 'ethers';
import { IRpcHandler } from '../../server/types';
import { IHandlerDependencies } from './types';
import { NotarizationCodec } from '../../serialization/NotarizationCodec';
import { removeHexPrefix, addHexPrefix } from '../../utils/hex';
import { fromBase58Check } from 'verus-typescript-primitives';
import { NOTARIZATION_MAX_GAS } from '../../config/constants';

/** VDXF ID for vrsc::system.notarization.signature */
const SIG_VDXF_TYPE = 'iP1QT5ee7EP63WSrfjiMFc1dVJVSAy85cT';

/** Reverse bytes of a hex string */
function reverseBytes(hex: string): string {
    const m = hex.match(/.{2}/g);
    return m ? m.reverse().join('') : hex;
}

/** Split a 65-byte hex signature into { v, r, s }. */
function splitSignature(sig: string): { v: number; r: string; s: string } {
    const clean = removeHexPrefix(sig);
    return {
        v: parseInt(clean.slice(0, 2), 16),
        r: '0x' + clean.slice(2, 66),
        s: '0x' + clean.slice(66, 130),
    };
}

/** Convert a Verus base58 address to 0x-prefixed Ethereum hex. */
function verusAddressToEth(addr: string): string {
    return '0x' + fromBase58Check(addr).hash.toString('hex');
}

/**
 * ABI-encode signature data for the contract, matching the original
 * `encodeSignatures` from utils.js.
 *
 * Encodes: { _vs: uint8[], _rs: bytes32[], _ss: bytes32[], blockheights: uint32[], notaryAddress: address[] }
 * Then strips the first 32-byte offset (64 hex chars + 0x prefix = slice(66))
 * so `abi.decode` in the contract receives the correct input.
 */
function encodeSignatures(
    signatures: Record<string, { signatures: string[]; blockheight: number }>,
): string {
    const sigKeys = Object.keys(signatures);
    const vs: number[] = [];
    const rs: string[] = [];
    const ss: string[] = [];
    const blockheights: number[] = [];
    const notaryAddresses: string[] = [];

    for (const key of sigKeys) {
        const split = splitSignature(signatures[key].signatures[0]);
        vs.push(split.v);
        rs.push(split.r);
        ss.push(split.s);
        blockheights.push(signatures[key].blockheight);
        notaryAddresses.push(verusAddressToEth(key));
    }

    const abiCoder = ethers.AbiCoder.defaultAbiCoder();
    const data = abiCoder.encode(
        ['uint8[]', 'bytes32[]', 'bytes32[]', 'uint32[]', 'address[]'],
        [vs, rs, ss, blockheights, notaryAddresses],
    );

    // Remove first 32 bytes offset (same as original: "0x" + data.slice(66))
    return '0x' + data.slice(66);
}

export class SubmitNotarizationHandler implements IRpcHandler<unknown[], unknown> {
    readonly method = 'submitacceptednotarization';
    private deps: IHandlerDependencies;

    constructor(deps: IHandlerDependencies) {
        this.deps = deps;
    }

    /**
     * Handle `submitacceptednotarization` RPC.
     * @param params - `[notarizationObj, { evidence: { chainobjects }, output: { txid, voutnum } }]`
     * @returns `{ txid }` on success
     */
    async handle(params?: unknown[]): Promise<unknown> {
        if (!params || params.length < 2) {
            throw new Error('submitacceptednotarization requires [notarization, evidenceObj]');
        }

        // Check wallet is available
        try {
            this.deps.provider.getWallet();
        } catch {
            return { error: true, message: 'No wallet configured — cannot submit notarizations' };
        }

        const notarizationObj = params[0] as Record<string, unknown>;
        const evidenceObj = params[1] as {
            evidence: { chainobjects: Array<{ vdxftype: string; value: { signatures: Record<string, unknown> } }> };
            output: { txid: string; voutnum: number };
        };

        // 1. Serialize notarization
        const serialized = NotarizationCodec.serialize(notarizationObj);

        // 2. Extract signatures from chain objects
        const signatures: Record<string, { signatures: string[]; blockheight: number }> = {};
        for (const obj of evidenceObj.evidence.chainobjects) {
            if (obj.vdxftype === SIG_VDXF_TYPE) {
                const sigKeys = Object.keys(obj.value.signatures);
                for (const key of sigKeys) {
                    signatures[key] = obj.value.signatures[key] as { signatures: string[]; blockheight: number };
                }
            }
        }

        if (Object.keys(signatures).length < 1) {
            return { error: true, message: 'Not enough signatures' };
        }

        // 3. Check duplicate
        const txidObj = evidenceObj.output;
        const lastTxid = this.deps.cache.api.get<string>('lastNotarizationTxid');
        if (lastTxid && lastTxid === txidObj.txid) {
            return '0';
        }

        // 4. Encode signatures
        const abiencodedSigData = encodeSignatures(signatures);
        const txid = addHexPrefix(reverseBytes(txidObj.txid));

        try {
            const delegator = this.deps.contracts.getDelegator();

            // Static call to test for revert
            await delegator.setLatestData.staticCall(
                serialized, txid, txidObj.voutnum, abiencodedSigData,
            );

            // Submit actual transaction
            const result = await this.deps.txSender.sendContractTransaction(
                delegator,
                'setLatestData',
                [serialized, txid, txidObj.voutnum, abiencodedSigData],
                { gasLimit: BigInt(NOTARIZATION_MAX_GAS) },
            );

            this.deps.cache.api.set('lastNotarizationTxid', txidObj.txid);
            return { txid: result.hash };
        } catch (error: unknown) {
            const msg = error instanceof Error ? error.message : String(error);
            if (msg.includes('execution reverted')) {
                return { error: true, message: 'Notarization reverted' };
            }
            if (msg.includes('already known')) {
                return { error: true, message: 'Notarization already submitted' };
            }
            return { error: true, message: msg };
        }
    }
}

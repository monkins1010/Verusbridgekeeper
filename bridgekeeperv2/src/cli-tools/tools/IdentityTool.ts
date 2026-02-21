/**
 * IdentityTool — identity revoke and recover operations.
 *
 * Mirrors the logic from utilities/upgrade.js for:
 *   - Revoke with main address
 *   - Recover with recovery address (single signer)
 *   - Create multisig revoke/recover packets
 *   - Submit multisig revoke/recover transactions
 *
 * These operations manage notary identities registered on the bridge contract.
 */

import { ethers } from 'ethers';
import { randomBytes } from 'crypto';
import * as fs from 'fs';
import * as path from 'path';
import { ICliTool, IToolContext, ToolCategory, createToolProvider, NO_KEY_MESSAGE } from '../types';
import { addHexPrefix, removeHexPrefix } from '../../utils/hex';

const TYPE_REVOKE = 2;
const TYPE_RECOVER = 3;
const MAX_GAS = 6_000_000;

export class IdentityTool implements ICliTool {
    readonly name = 'Identity Management';
    readonly description = 'Revoke or recover notary identities (single + multisig)';
    readonly category = ToolCategory.IdentityManagement;
    readonly help = [
        'Manage notary identities on the Ethereum bridge contract.',
        '',
        'Operations:',
        '  Revoke (main address)    — Revoke your notary ID using your main signing address.',
        '  Recover (recovery addr)  — Recover a notary ID using the recovery address.',
        '                             Requires a Verus daemon signature.',
        '  Create Multisig Revoke   — Generate a signed revoke packet for multisig.',
        '  Create Multisig Recover  — Generate a signed recover packet for multisig.',
        '  Submit Multisig Revoke   — Submit a revoke using collected multisig packets.',
        '  Submit Multisig Recover  — Submit a recover using collected multisig packets.',
        '',
        'For multisig operations, each notary generates a packet. Once enough',
        'packets are collected, one notary combines them and submits.',
    ].join('\n');

    async run(ctx: IToolContext): Promise<void> {
        const inquirer = (await import('inquirer')).default;
        const chalk = (await import('chalk')).default;

        const { action } = await inquirer.prompt([
            {
                type: 'list',
                name: 'action',
                message: 'Select identity action:',
                choices: [
                    { name: 'Revoke with main address', value: 'revoke' },
                    { name: 'Recover with recovery address', value: 'recover' },
                    { name: 'Create multisig revoke packet', value: 'create-revoke' },
                    { name: 'Create multisig recover packet', value: 'create-recover' },
                    { name: 'Submit multisig revoke', value: 'submit-revoke' },
                    { name: 'Submit multisig recover', value: 'submit-recover' },
                ],
            },
        ]);

        // Packet creation only needs Verus daemon — no Ethereum provider or key
        if (action === 'create-revoke') {
            await this.createMultisigRevokePacket(ctx, inquirer, chalk);
            return;
        }
        if (action === 'create-recover') {
            await this.createMultisigRecoverPacket(ctx, inquirer, chalk);
            return;
        }

        // All remaining actions require a private key to send transactions
        if (!ctx.privateKey) {
            console.log(chalk.yellow('\u26A0 ' + NO_KEY_MESSAGE));
            return;
        }

        const { provider, wallet, delegator } = await createToolProvider(ctx);

        try {
            switch (action) {
                case 'revoke':
                    await this.revokeWithMain(delegator, wallet, inquirer, chalk);
                    break;
                case 'recover':
                    await this.recoverWithRecovery(delegator, wallet, ctx, inquirer, chalk);
                    break;
                case 'submit-revoke':
                    await this.submitMultisigRevoke(delegator, wallet, inquirer, chalk);
                    break;
                case 'submit-recover':
                    await this.submitMultisigRecover(delegator, wallet, inquirer, chalk);
                    break;
            }
        } finally {
            await provider.destroy();
        }
    }

    /** Revoke a notary using the main address — calls revokeWithMainAddress("0xff") */
    private async revokeWithMain(
        delegator: ethers.Contract,
        wallet: ethers.Wallet,
        inquirer: typeof import('inquirer').default,
        chalk: typeof import('chalk').default,
    ): Promise<void> {
        console.log(`\nRevoking notary from wallet: ${chalk.cyan(wallet.address)}`);

        const { confirm } = await inquirer.prompt([
            {
                type: 'confirm',
                name: 'confirm',
                message: 'Are you sure you want to revoke your notary ID?',
                default: false,
            },
        ]);

        if (!confirm) {
            console.log('Cancelled.');
            return;
        }

        console.log('Submitting revoke transaction — please wait...');
        const tx = await delegator.revokeWithMainAddress('0xff', { gasLimit: MAX_GAS });
        console.log(`TX hash: ${tx.hash}`);

        const receipt = await tx.wait(1, 120_000);
        console.log(`Confirmed in block ${receipt.blockNumber}`);
    }

    /** Recover a notary using the recovery address — requires Verus daemon for signing */
    private async recoverWithRecovery(
        delegator: ethers.Contract,
        wallet: ethers.Wallet,
        ctx: IToolContext,
        inquirer: typeof import('inquirer').default,
        chalk: typeof import('chalk').default,
    ): Promise<void> {
        if (!ctx.verusDaemonRpc) {
            console.log(chalk.red('Verus daemon RPC not available. Cannot sign recovery message.'));
            return;
        }

        const { fromBase58Check } = await import('verus-typescript-primitives');

        const answers = await inquirer.prompt([
            {
                type: 'input',
                name: 'notaryIAddr',
                message: 'Notary i-address to recover:',
            },
            {
                type: 'input',
                name: 'newMainEth',
                message: 'New main signing ETH address:',
                validate: (i: string) => ethers.isAddress(i) || 'Invalid address.',
            },
            {
                type: 'input',
                name: 'newRecoverEth',
                message: 'New recovery ETH address:',
                validate: (i: string) => ethers.isAddress(i) || 'Invalid address.',
            },
            {
                type: 'input',
                name: 'signingRAddr',
                message: 'Signing R-address (current recovery):',
            },
        ]);

        const notaryHex = addHexPrefix(fromBase58Check(answers.notaryIAddr).hash.toString('hex'));

        console.log(`\n  Notary:      ${answers.notaryIAddr} → ${chalk.dim(notaryHex)}`);
        console.log(`  New main:    ${answers.newMainEth}`);
        console.log(`  New recover: ${answers.newRecoverEth}`);
        console.log(`  Signer:      ${answers.signingRAddr}`);

        const { proceed } = await inquirer.prompt([
            { type: 'confirm', name: 'proceed', message: 'Proceed with signing?', default: false },
        ]);

        if (!proceed) {
            console.log('Cancelled.');
            return;
        }

        const salt = randomBytes(32);
        const outBuffer = Buffer.alloc(1);
        outBuffer.writeUInt8(TYPE_RECOVER);

        const serialized = Buffer.concat([
            Buffer.from(removeHexPrefix(answers.newMainEth), 'hex'),
            Buffer.from(removeHexPrefix(answers.newRecoverEth), 'hex'),
            outBuffer,
            salt,
        ]);

        // Sign via Verus daemon
        const sigBase64 = await this.verusSign(ctx, answers.signingRAddr, serialized.toString('hex'));
        if (!sigBase64) return;

        const sigBuffer = Buffer.from(sigBase64, 'base64');
        const v = sigBuffer.readUInt8(0);
        const r = addHexPrefix(sigBuffer.subarray(1, 33).toString('hex'));
        const s = addHexPrefix(sigBuffer.subarray(33, 65).toString('hex'));

        // Encode the recover tuple
        const coder = ethers.AbiCoder.defaultAbiCoder();
        const recoverData = coder.encode(
            ['tuple(uint8,bytes32,bytes32,address[],uint8,bytes32,address,uint32)'],
            [[v, r, s, [answers.newMainEth, answers.newRecoverEth], TYPE_RECOVER, addHexPrefix(salt.toString('hex')), notaryHex, 0]],
        );

        console.log('Submitting recover transaction — please wait...');

        // Dry run
        await delegator.recoverWithRecoveryAddress.staticCall(recoverData);

        const tx = await delegator.recoverWithRecoveryAddress(recoverData, { gasLimit: MAX_GAS });
        console.log(`TX hash: ${tx.hash}`);

        const receipt = await tx.wait(1, 120_000);
        console.log(`Confirmed in block ${receipt.blockNumber}`);
    }

    /** Create a multisig revoke packet — generates a signed JSON packet */
    private async createMultisigRevokePacket(
        ctx: IToolContext,
        inquirer: typeof import('inquirer').default,
        chalk: typeof import('chalk').default,
    ): Promise<void> {
        if (!ctx.verusDaemonRpc) {
            console.log(chalk.red('Verus daemon RPC not available.'));
            return;
        }

        const { fromBase58Check } = await import('verus-typescript-primitives');

        const answers = await inquirer.prompt([
            { type: 'input', name: 'yourNotary', message: 'Your notary i-address:' },
            { type: 'input', name: 'targetNotary', message: 'Notary i-address to revoke:' },
            { type: 'input', name: 'signingRAddr', message: 'Your signing R-address:' },
        ]);

        const yourHex = addHexPrefix(fromBase58Check(answers.yourNotary).hash.toString('hex'));
        const targetHex = addHexPrefix(fromBase58Check(answers.targetNotary).hash.toString('hex'));

        console.log(`\n  Your notary: ${answers.yourNotary} → ${chalk.dim(yourHex)}`);
        console.log(`  Target:      ${answers.targetNotary} → ${chalk.dim(targetHex)}`);

        const salt = randomBytes(32);
        const outBuffer = Buffer.alloc(1);
        outBuffer.writeUInt8(TYPE_REVOKE);

        const serialized = Buffer.concat([
            outBuffer,
            Buffer.from(removeHexPrefix(targetHex), 'hex'),
            salt,
        ]);

        const sigBase64 = await this.verusSign(ctx, answers.signingRAddr, serialized.toString('hex'));
        if (!sigBase64) return;

        const sigBuffer = Buffer.from(sigBase64, 'base64');
        const v = sigBuffer.readUInt8(0);
        const r = addHexPrefix(sigBuffer.subarray(1, 33).toString('hex'));
        const s = addHexPrefix(sigBuffer.subarray(33, 65).toString('hex'));

        const packet = {
            _vs: v,
            _rs: r,
            _ss: s,
            salt: addHexPrefix(salt.toString('hex')),
            notarizerID: yourHex,
        };

        console.log(`\nNotary to revoke: ${targetHex}`);
        console.log(chalk.bold('Revoke packet:'));
        console.log(JSON.stringify(packet, null, 2));
        console.log(chalk.dim('\nShare this packet with other notaries for multisig submission.'));
    }

    /** Create a multisig recover packet */
    private async createMultisigRecoverPacket(
        ctx: IToolContext,
        inquirer: typeof import('inquirer').default,
        chalk: typeof import('chalk').default,
    ): Promise<void> {
        if (!ctx.verusDaemonRpc) {
            console.log(chalk.red('Verus daemon RPC not available.'));
            return;
        }

        const { fromBase58Check } = await import('verus-typescript-primitives');

        const answers = await inquirer.prompt([
            { type: 'input', name: 'yourNotary', message: 'Your notary i-address:' },
            { type: 'input', name: 'targetNotary', message: 'Notary i-address to recover:' },
            { type: 'input', name: 'signingRAddr', message: 'Your signing R-address:' },
            {
                type: 'input',
                name: 'newMain',
                message: 'New main signing ETH address:',
                validate: (i: string) => ethers.isAddress(i) || 'Invalid address.',
            },
            {
                type: 'input',
                name: 'newRecover',
                message: 'New recovery ETH address:',
                validate: (i: string) => ethers.isAddress(i) || 'Invalid address.',
            },
        ]);

        const yourHex = addHexPrefix(fromBase58Check(answers.yourNotary).hash.toString('hex'));
        const targetHex = addHexPrefix(fromBase58Check(answers.targetNotary).hash.toString('hex'));

        const salt = randomBytes(32);
        const outBuffer = Buffer.alloc(1);
        outBuffer.writeUInt8(TYPE_RECOVER);

        const serialized = Buffer.concat([
            outBuffer,
            Buffer.from(removeHexPrefix(targetHex), 'hex'),
            Buffer.from(removeHexPrefix(answers.newMain), 'hex'),
            Buffer.from(removeHexPrefix(answers.newRecover), 'hex'),
            salt,
        ]);

        const sigBase64 = await this.verusSign(ctx, answers.signingRAddr, serialized.toString('hex'));
        if (!sigBase64) return;

        const sigBuffer = Buffer.from(sigBase64, 'base64');
        const v = sigBuffer.readUInt8(0);
        const r = addHexPrefix(sigBuffer.subarray(1, 33).toString('hex'));
        const s = addHexPrefix(sigBuffer.subarray(33, 65).toString('hex'));

        const packet = {
            _vs: v,
            _rs: r,
            _ss: s,
            salt: addHexPrefix(salt.toString('hex')),
            notarizerID: yourHex,
        };

        console.log(`\nNotary to recover: ${targetHex}`);
        console.log(`New main address:  ${answers.newMain}`);
        console.log(`New recover addr:  ${answers.newRecover}`);
        console.log(chalk.bold('Recover packet:'));
        console.log(JSON.stringify(packet, null, 2));
        console.log(chalk.dim('\nShare this packet with other notaries for multisig submission.'));
    }

    /** Submit a multisig revoke from a JSON file */
    private async submitMultisigRevoke(
        delegator: ethers.Contract,
        wallet: ethers.Wallet,
        inquirer: typeof import('inquirer').default,
        chalk: typeof import('chalk').default,
    ): Promise<void> {
        const { filePath } = await inquirer.prompt([
            {
                type: 'input',
                name: 'filePath',
                message: 'Path to multisig revoke JSON file (e.g. revokemultisig.json):',
            },
        ]);

        const raw = fs.readFileSync(path.resolve(filePath as string), 'utf8');
        const packet = JSON.parse(raw);

        console.log(chalk.bold('\nRevoke multisig data:'));
        console.log(JSON.stringify(packet, null, 2));

        const { confirm } = await inquirer.prompt([
            { type: 'confirm', name: 'confirm', message: 'Submit multisig revoke?', default: false },
        ]);

        if (!confirm) {
            console.log('Cancelled.');
            return;
        }

        const encodedData = this.encodeRevokeMultisig(packet);

        console.log('Submitting multisig revoke — please wait...');
        await delegator.revokeWithMultiSig.staticCall(encodedData);
        const tx = await delegator.revokeWithMultiSig(encodedData, { gasLimit: MAX_GAS });
        console.log(`TX hash: ${tx.hash}`);

        const receipt = await tx.wait(1, 120_000);
        console.log(`Confirmed in block ${receipt.blockNumber}`);
    }

    /** Submit a multisig recover from a JSON file */
    private async submitMultisigRecover(
        delegator: ethers.Contract,
        wallet: ethers.Wallet,
        inquirer: typeof import('inquirer').default,
        chalk: typeof import('chalk').default,
    ): Promise<void> {
        const { filePath } = await inquirer.prompt([
            {
                type: 'input',
                name: 'filePath',
                message: 'Path to multisig recover JSON file (e.g. recovermultisig.json):',
            },
        ]);

        const raw = fs.readFileSync(path.resolve(filePath as string), 'utf8');
        const packet = JSON.parse(raw);

        console.log(chalk.bold('\nRecover multisig data:'));
        console.log(JSON.stringify(packet, null, 2));

        const { confirm } = await inquirer.prompt([
            { type: 'confirm', name: 'confirm', message: 'Submit multisig recover?', default: false },
        ]);

        if (!confirm) {
            console.log('Cancelled.');
            return;
        }

        const encodedData = this.encodeRecoverMultisig(packet);

        console.log('Submitting multisig recover — please wait...');
        await delegator.recoverWithMultiSig.staticCall(encodedData);
        const tx = await delegator.recoverWithMultiSig(encodedData, { gasLimit: MAX_GAS });
        console.log(`TX hash: ${tx.hash}`);

        const receipt = await tx.wait(1, 120_000);
        console.log(`Confirmed in block ${receipt.blockNumber}`);
    }

    /** Make a signmessage RPC call to the Verus daemon */
    private async verusSign(
        ctx: IToolContext,
        rAddress: string,
        hexMessage: string,
    ): Promise<string | null> {
        if (!ctx.verusDaemonRpc) return null;

        const { url, user, password } = ctx.verusDaemonRpc;
        const auth = Buffer.from(`${user}:${password}`).toString('base64');

        const res = await fetch(url, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                Authorization: `Basic ${auth}`,
            },
            body: JSON.stringify({
                jsonrpc: '2.0',
                method: 'signmessage',
                params: [rAddress, hexMessage],
                id: 1,
            }),
        });

        const data = (await res.json()) as { result?: { signature: string }; error?: unknown };
        if (data.error || !data.result) {
            console.error('Verus signmessage failed:', data.error);
            return null;
        }

        return data.result.signature;
    }

    /** Encode revoke multisig tuple for the contract call */
    private encodeRevokeMultisig(packet: {
        signatures: Array<{
            _vs: number;
            _rs: string;
            _ss: string;
            salt: string;
            notarizerID: string;
        }>;
        notarytorevoke: string;
    }): string {
        const coder = ethers.AbiCoder.defaultAbiCoder();

        const sigs = packet.signatures.map((s) => [s._vs, s._rs, s._ss, s.salt, s.notarizerID]);

        return coder.encode(
            ['tuple(uint8,bytes32,bytes32,bytes32,address)[]', 'address'],
            [sigs, packet.notarytorevoke],
        );
    }

    /** Encode recover multisig tuple for the contract call */
    private encodeRecoverMultisig(packet: {
        signatures: Array<{
            _vs: number;
            _rs: string;
            _ss: string;
            salt: string;
            notarizerID: string;
        }>;
        notarytorecover: string;
        notarynewmain: string;
        notarynewrecover: string;
    }): string {
        const coder = ethers.AbiCoder.defaultAbiCoder();

        const sigs = packet.signatures.map((s) => [s._vs, s._rs, s._ss, s.salt, s.notarizerID]);

        return coder.encode(
            ['tuple(uint8,bytes32,bytes32,bytes32,address)[]', 'address', 'address', 'address'],
            [sigs, packet.notarytorecover, packet.notarynewmain, packet.notarynewrecover],
        );
    }
}

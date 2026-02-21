/**
 * UpgradeTool — contract upgrade operations.
 *
 * Mirrors the logic from utilities/upgrade.js. Supports:
 *   - Get Contract Hash: compute the keccak256 hash for a proposed contract upgrade
 *   - Upgrade Contracts: submit a contract upgrade transaction
 *   - Count Votes: tally rolling upgrade votes from the contract
 */

import { ethers } from 'ethers';
import { randomBytes } from 'crypto';
import { ICliTool, IToolContext, ToolCategory, createReadOnlyProvider, createToolProvider, NO_KEY_MESSAGE } from '../types';
import { ContractType } from '../../config/constants';

const TYPE_CONTRACT = 1;
const MAX_GAS = 6_000_000;
const NUM_SUB_CONTRACTS = 11;

export class UpgradeTool implements ICliTool {
    readonly name = 'Contract Upgrade';
    readonly description = 'Upgrade bridge contracts, compute hashes, count votes';
    readonly category = ToolCategory.ContractUpgrade;
    readonly help = [
        'Manage bridge contract upgrades on Ethereum.',
        '',
        'Sub-commands:',
        '  Get Contract Hash — Compute the keccak256 hash for a proposed upgrade.',
        '                      Other notaries use this hash to verify the upgrade.',
        '  Upgrade Contracts — Submit a contract upgrade with a known salt.',
        '  Count Votes       — Tally the rolling upgrade votes from the contract.',
        '',
        'Contract types:',
        ...Object.entries(ContractType)
            .filter(([, v]) => typeof v === 'number' && (v as number) < (ContractType.LastIndex as number))
            .map(([name, idx]) => `  ${idx} = ${name}`),
    ].join('\n');

    async run(ctx: IToolContext): Promise<void> {
        const inquirer = (await import('inquirer')).default;
        const chalk = (await import('chalk')).default;

        const { action } = await inquirer.prompt([
            {
                type: 'list',
                name: 'action',
                message: 'Select upgrade action:',
                choices: [
                    { name: 'Get Contract Hash — compute hash for a proposed upgrade', value: 'hash' },
                    { name: 'Upgrade Contracts — submit upgrade with salt', value: 'upgrade' },
                    { name: 'Count Votes       — tally rolling upgrade votes', value: 'votes' },
                ],
            },
        ]);

        // Upgrade requires a private key to send a transaction
        if (action === 'upgrade') {
            if (!ctx.privateKey) {
                console.log(chalk.yellow('\u26A0 ' + NO_KEY_MESSAGE));
                return;
            }
            const { provider, wallet, delegator } = await createToolProvider(ctx);
            try {
                await this.upgradeContracts(delegator, wallet, provider, inquirer, chalk);
            } finally {
                await provider.destroy();
            }
            return;
        }

        // Hash and votes are read-only — no private key needed
        const { provider, delegator } = await createReadOnlyProvider(ctx);

        try {
            switch (action) {
                case 'hash':
                    await this.getContractHash(delegator, provider, inquirer, chalk);
                    break;
                case 'votes':
                    await this.countVotes(delegator, chalk);
                    break;
            }
        } finally {
            await provider.destroy();
        }
    }

    /** Compute the keccak256 hash of a proposed contract upgrade */
    private async getContractHash(
        delegator: ethers.Contract,
        provider: ethers.WebSocketProvider,
        inquirer: typeof import('inquirer').default,
        chalk: typeof import('chalk').default,
    ): Promise<void> {
        // Get current contracts
        const contracts: string[] = [];
        for (let i = 0; i < NUM_SUB_CONTRACTS; i++) {
            contracts.push(await delegator.contracts(i));
        }

        this.printContractList(contracts, chalk);

        const answers = await inquirer.prompt([
            {
                type: 'input',
                name: 'contractType',
                message: `Contract type to replace (0-${NUM_SUB_CONTRACTS - 1}):`,
                validate: (input: string) => {
                    const n = parseInt(input, 10);
                    if (isNaN(n) || n < 0 || n >= NUM_SUB_CONTRACTS) {
                        return `Enter a number between 0 and ${NUM_SUB_CONTRACTS - 1}`;
                    }
                    return true;
                },
            },
            {
                type: 'input',
                name: 'contractAddress',
                message: 'New contract address (0x...):',
                validate: (input: string) => {
                    if (ethers.isAddress(input)) return true;
                    return 'Invalid Ethereum address.';
                },
            },
        ]);

        const contractType = parseInt(answers.contractType, 10);
        const newAddress = answers.contractAddress as string;

        // Replace the contract in the list
        contracts[contractType] = newAddress;

        // Generate random salt
        const salt = randomBytes(32);

        // Serialize: all 11 contract addresses + type byte + salt
        const outBuffer = Buffer.alloc(1);
        outBuffer.writeUInt8(TYPE_CONTRACT);

        let contractsHex = Buffer.alloc(0);
        for (let i = 0; i < NUM_SUB_CONTRACTS; i++) {
            contractsHex = Buffer.concat([contractsHex, Buffer.from(contracts[i].slice(2), 'hex')]);
        }

        const serialized = Buffer.concat([contractsHex, outBuffer, salt]);
        const hash = ethers.keccak256(serialized);

        const typeName = ContractType[contractType] ?? `Unknown(${contractType})`;
        console.log('');
        console.log(`New contract: ${chalk.cyan(newAddress)} — Type: ${chalk.yellow(typeName)}`);
        console.log(`Salt: ${chalk.dim('0x' + salt.toString('hex'))}`);
        console.log(`Hash for upgrade: ${chalk.green('0x' + hash.slice(26, 66))}`);
    }

    /** Submit a contract upgrade transaction */
    private async upgradeContracts(
        delegator: ethers.Contract,
        wallet: ethers.Wallet,
        provider: ethers.WebSocketProvider,
        inquirer: typeof import('inquirer').default,
        chalk: typeof import('chalk').default,
    ): Promise<void> {
        // Get current contracts
        const contracts: string[] = [];
        for (let i = 0; i < NUM_SUB_CONTRACTS; i++) {
            contracts.push(await delegator.contracts(i));
        }

        this.printContractList(contracts, chalk);

        const answers = await inquirer.prompt([
            {
                type: 'input',
                name: 'contractType',
                message: `Contract type to replace (0-${NUM_SUB_CONTRACTS - 1}):`,
                validate: (input: string) => {
                    const n = parseInt(input, 10);
                    if (isNaN(n) || n < 0 || n >= NUM_SUB_CONTRACTS) {
                        return `Enter a number between 0 and ${NUM_SUB_CONTRACTS - 1}`;
                    }
                    return true;
                },
            },
            {
                type: 'input',
                name: 'contractAddress',
                message: 'New contract address (0x...):',
                validate: (input: string) => {
                    if (ethers.isAddress(input)) return true;
                    return 'Invalid Ethereum address.';
                },
            },
            {
                type: 'input',
                name: 'salt',
                message: 'Salt (hex, 64 chars, no 0x prefix):',
                validate: (input: string) => {
                    const clean = input.replace(/^0x/i, '');
                    if (/^[0-9a-fA-F]{64}$/.test(clean)) return true;
                    return 'Salt must be 64 hex characters.';
                },
            },
        ]);

        const contractType = parseInt(answers.contractType, 10);
        contracts[contractType] = answers.contractAddress;

        const salt = '0x' + (answers.salt as string).replace(/^0x/i, '');
        const typeName = ContractType[contractType] ?? `Unknown(${contractType})`;

        console.log('');
        console.log(`New contract: ${chalk.cyan(answers.contractAddress)} — Type: ${chalk.yellow(typeName)}`);
        console.log(`Salt: ${chalk.dim(salt)}`);

        // Encode the upgrade tuple
        const coder = ethers.AbiCoder.defaultAbiCoder();
        const upgradeTuple = coder.encode(
            ['tuple(uint8,bytes32,bytes32,address[],uint8,bytes32,address,uint32)'],
            [[
                0,                              // _vs placeholder
                ethers.ZeroHash,                // _rs placeholder
                ethers.ZeroHash,                // _ss placeholder
                contracts,                      // contracts array
                TYPE_CONTRACT,                  // upgrade type
                salt,                           // salt
                ethers.ZeroAddress,             // notarizerID placeholder
                0,                              // unused
            ]],
        );

        const { confirm } = await inquirer.prompt([
            {
                type: 'confirm',
                name: 'confirm',
                message: 'Submit upgrade transaction?',
                default: false,
            },
        ]);

        if (!confirm) {
            console.log('Cancelled.');
            return;
        }

        console.log('Submitting upgrade — please wait...');

        // Dry run first
        await delegator.upgradeContracts.staticCall(upgradeTuple);

        const tx = await delegator.upgradeContracts(upgradeTuple, { gasLimit: MAX_GAS });
        console.log(`TX hash: ${tx.hash}`);

        const receipt = await tx.wait(1, 120_000);
        console.log(`Confirmed in block ${receipt.blockNumber}`);
    }

    /** Count rolling upgrade votes from the contract */
    private async countVotes(
        delegator: ethers.Contract,
        chalk: typeof import('chalk').default,
    ): Promise<void> {
        console.log('Reading votes...');

        const votes: string[] = [];
        for (let i = 0; i < 50; i++) {
            try {
                const vote = (await delegator.rollingUpgradeVotes(i)) as string;
                votes.push(vote.toLowerCase());
            } catch {
                break; // Reached end of array
            }
        }

        // Count occurrences
        const counts = new Map<string, number>();
        for (const v of votes) {
            counts.set(v, (counts.get(v) ?? 0) + 1);
        }

        // Sort by count descending
        const sorted = [...counts.entries()].sort((a, b) => b[1] - a[1]);

        console.log(`\n${chalk.bold('Vote Counts:')}`);
        for (const [address, count] of sorted) {
            console.log(`  ${address} = ${chalk.green(String(count))}`);
        }
    }

    /** Print the list of current sub-contracts */
    private printContractList(contracts: string[], chalk: typeof import('chalk').default): void {
        console.log(`\n${chalk.bold('Current sub-contracts:')}`);
        for (let i = 0; i < contracts.length; i++) {
            const name = ContractType[i] ?? `Unknown(${i})`;
            console.log(`  ${chalk.dim(String(i))} ${name}: ${contracts[i]}`);
        }
        console.log('');
    }
}

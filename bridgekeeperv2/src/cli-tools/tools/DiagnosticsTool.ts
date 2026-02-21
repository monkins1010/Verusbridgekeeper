/**
 * DiagnosticsTool — diagnostic checks and info queries.
 *
 * Combines functionality from:
 *   - utilities/getcontractdai.js (DAI balance / DSR health check)
 *   - utilities/getnotariesbalance.js (notary fee pool balance)
 *   - utilities/convert.js (base58 → hex address conversion)
 *   - General diagnostics (wallet balance, contract addresses, etc.)
 */

import { ethers } from 'ethers';
import { ICliTool, IToolContext, ToolCategory, createReadOnlyProvider, createToolProvider, NO_KEY_MESSAGE } from '../types';
import { ContractType } from '../../config/constants';

/* ----- VDXF keys ----- */
const VDXF_SYSTEM_DAI_HOLDINGS =
    '0x000000000000000000000000334711b41Cf095C9D44d1a209f34bf3559eA7640';
const VDXFID_DAI_DSR_SUPPLY =
    '0x00000000000000000000000084206E821f7bB4c6F390299c1367600F608c28C8';
const VDXF_SYSTEM_NOTARIZATION_NOTARYFEEPOOL =
    '0x00000000000000000000000039aDf7BA6E5c91eeef476Bb4aC9417549ba0d51a';
const EMPTY_LOCATION =
    '0x0100000000000000000000000000000000000000000000000000000000000000';

/** MakerDAO DSR Pot (mainnet) */
const DSR_POT_ADDRESS = '0x197e90f9fad81970ba7976f33cbd77088e5d7cf7';
const POT_ABI = [
    'function chi() view returns (uint256)',
    'function rho() view returns (uint256)',
    'function pie(address) view returns (uint256)',
];

const RAY = 10n ** 27n;
const NUM_SUB_CONTRACTS = 11;

function rmul(x: bigint, y: bigint): bigint {
    return (x * y) / RAY;
}

function rdivup(x: bigint, y: bigint): bigint {
    return (x * RAY + y - 1n) / y;
}

function uint64ToVerusFloat(value: bigint): string {
    const SATS = 100_000_000n;
    const whole = value / SATS;
    const frac = value % SATS;
    return `${whole}.${frac.toString().padStart(8, '0')}`;
}

export class DiagnosticsTool implements ICliTool {
    readonly name = 'Diagnostics';
    readonly description = 'Check balances, DAI health, convert addresses, list contracts';
    readonly category = ToolCategory.Diagnostics;
    readonly help = [
        'Run various diagnostic checks against the bridge contract.',
        '',
        'Available checks:',
        '  Wallet Balance       — ETH balance of the bridge wallet',
        '  Notary Fee Pool      — Claimable notary pool fees',
        '  DAI / DSR Health     — DAI holdings, DSR balance, discrepancy check',
        '  List Sub-Contracts   — Current sub-contract addresses',
        '  Convert Address      — Base58 (Verus) → hex (Ethereum) conversion',
    ].join('\n');

    async run(ctx: IToolContext): Promise<void> {
        const inquirer = (await import('inquirer')).default;
        const chalk = (await import('chalk')).default;

        const { action } = await inquirer.prompt([
            {
                type: 'list',
                name: 'action',
                message: 'Select diagnostic:',
                choices: [
                    { name: 'Wallet Balance       — ETH balance of the bridge wallet', value: 'balance' },
                    { name: 'Notary Fee Pool      — Claimable notary pool fees', value: 'fees' },
                    { name: 'DAI / DSR Health     — Full DAI health check', value: 'dai' },
                    { name: 'List Sub-Contracts   — Current sub-contract addresses', value: 'contracts' },
                    { name: 'Convert Address      — Base58 → hex conversion', value: 'convert' },
                ],
            },
        ]);

        if (action === 'convert') {
            await this.convertAddress(inquirer, chalk);
            return;
        }

        // Wallet balance requires a private key to derive the wallet address
        if (action === 'balance') {
            if (!ctx.privateKey) {
                console.log(chalk.yellow('⚠ Wallet balance requires a private key in veth.conf to derive the wallet address.'));
                return;
            }
            const { provider, wallet } = await createToolProvider(ctx);
            try {
                await this.showBalance(provider, wallet, chalk);
            } finally {
                await provider.destroy();
            }
            return;
        }

        // Remaining diagnostics are read-only — no private key needed
        const { provider, delegator } = await createReadOnlyProvider(ctx);

        try {
            switch (action) {
                case 'fees':
                    await this.showFeePool(delegator, chalk);
                    break;
                case 'dai':
                    await this.showDaiHealth(delegator, provider, ctx.delegatorAddress, chalk);
                    break;
                case 'contracts':
                    await this.listContracts(delegator, chalk);
                    break;
            }
        } finally {
            await provider.destroy();
        }
    }

    /** Show wallet ETH balance */
    private async showBalance(
        provider: ethers.WebSocketProvider,
        wallet: ethers.Wallet,
        chalk: typeof import('chalk').default,
    ): Promise<void> {
        const balance = await provider.getBalance(wallet.address);
        const block = await provider.getBlockNumber();

        console.log(`\n  Wallet:  ${chalk.cyan(wallet.address)}`);
        console.log(`  Balance: ${chalk.green(ethers.formatEther(balance))} ETH`);
        console.log(`  Block:   ${block}`);
    }

    /** Show notary fee pool balance */
    private async showFeePool(
        delegator: ethers.Contract,
        chalk: typeof import('chalk').default,
    ): Promise<void> {
        const [fees1, fees2] = await Promise.all([
            delegator.claimableFees(VDXF_SYSTEM_NOTARIZATION_NOTARYFEEPOOL) as Promise<bigint>,
            delegator.claimableFees(EMPTY_LOCATION) as Promise<bigint>,
        ]);

        const total = fees1 + fees2;
        console.log(`\n  Fee pool:     ${chalk.green(uint64ToVerusFloat(fees1))} ETH`);
        console.log(`  Overflow:     ${chalk.green(uint64ToVerusFloat(fees2))} ETH`);
        console.log(`  Total:        ${chalk.green(uint64ToVerusFloat(total))} ETH`);
    }

    /** Full DAI DSR health check (mirrors getcontractdai.js) */
    private async showDaiHealth(
        delegator: ethers.Contract,
        provider: ethers.WebSocketProvider,
        delegatorAddress: string,
        chalk: typeof import('chalk').default,
    ): Promise<void> {
        const potContract = new ethers.Contract(DSR_POT_ADDRESS, POT_ABI, provider);

        const [daiHoldings, dsrSupply, chi, rho, actualPie] = await Promise.all([
            delegator.claimableFees(VDXF_SYSTEM_DAI_HOLDINGS) as Promise<bigint>,
            delegator.claimableFees(VDXFID_DAI_DSR_SUPPLY) as Promise<bigint>,
            potContract.chi() as Promise<bigint>,
            potContract.rho() as Promise<bigint>,
            potContract.pie(delegatorAddress) as Promise<bigint>,
        ]);

        const recordedDaiInDsr = rmul(chi, dsrSupply);
        const actualDaiInDsr = rmul(chi, actualPie);
        const pieDiscrepancy = actualPie - dsrSupply;
        const hasPieDiscrepancy = pieDiscrepancy !== 0n;
        const currentTs = BigInt(Math.floor(Date.now() / 1000));
        const dripPending = currentTs > rho;

        // Compute max exitable
        const maxExitByDsr = rmul(chi, dsrSupply);
        const maxExitable = maxExitByDsr < daiHoldings ? maxExitByDsr : daiHoldings;

        console.log(chalk.bold('\n=== DAI / DSR Health Check ==='));

        console.log(chalk.bold('\n--- Internal Accounting (claimableFees) ---'));
        console.log(`  DAI Holdings:              ${ethers.formatEther(daiHoldings)} DAI`);
        console.log(`  DSR Supply (pie):          ${ethers.formatEther(dsrSupply)}`);
        console.log(`  Recorded DAI value in DSR: ${ethers.formatEther(recordedDaiInDsr)} DAI`);

        console.log(chalk.bold('\n--- Actual DSR Pot Balance ---'));
        console.log(`  Actual pie in Pot:         ${ethers.formatEther(actualPie)}`);
        console.log(`  Actual DAI value in DSR:   ${ethers.formatEther(actualDaiInDsr)} DAI`);

        if (hasPieDiscrepancy) {
            const abs = pieDiscrepancy < 0n ? -pieDiscrepancy : pieDiscrepancy;
            const sign = pieDiscrepancy < 0n ? 'UNDER-REPORTED' : 'OVER-REPORTED';
            console.log(chalk.red(`  DISCREPANCY: ${sign}`));
            console.log(`    Difference (pie): ${ethers.formatEther(pieDiscrepancy)}`);
            console.log(`    Difference (DAI): ${ethers.formatEther(rmul(chi, abs))} DAI`);
        } else {
            console.log(chalk.green('  Internal accounting matches actual DSR balance.'));
        }

        console.log(`\n  Drip pending: ${dripPending ? chalk.yellow('Yes') : 'No'}`);
        console.log(`  Max exitable DAI: ${chalk.green(ethers.formatEther(maxExitable))} DAI`);
    }

    /** List all sub-contract addresses */
    private async listContracts(
        delegator: ethers.Contract,
        chalk: typeof import('chalk').default,
    ): Promise<void> {
        console.log(chalk.bold('\nSub-Contracts:'));
        for (let i = 0; i < NUM_SUB_CONTRACTS; i++) {
            const addr = await delegator.contracts(i);
            const name = ContractType[i] ?? `Unknown(${i})`;
            console.log(`  ${chalk.dim(String(i).padStart(2))} ${name.padEnd(25)} ${addr}`);
        }
    }

    /** Convert a base58check address to hex (like convert.js) */
    private async convertAddress(
        inquirer: typeof import('inquirer').default,
        chalk: typeof import('chalk').default,
    ): Promise<void> {
        const { fromBase58Check } = await import('verus-typescript-primitives');

        const { address } = await inquirer.prompt([
            {
                type: 'input',
                name: 'address',
                message: 'Base58 address (e.g. i-address or R-address):',
                validate: (input: string) => {
                    if (!input || input.length < 20) return 'Address too short.';
                    return true;
                },
            },
        ]);

        try {
            const decoded = fromBase58Check(address);
            const hexAddr = '0x' + decoded.hash.toString('hex');
            console.log(`\n  Base58: ${chalk.cyan(address)}`);
            console.log(`  Hex:    ${chalk.green(hexAddr)}`);
        } catch (err: unknown) {
            const msg = err instanceof Error ? err.message : String(err);
            console.log(chalk.red(`Failed to decode: ${msg}`));
        }
    }
}

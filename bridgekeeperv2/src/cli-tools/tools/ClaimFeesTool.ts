/**
 * ClaimFeesTool — claim notary fee pool ETH.
 *
 * Mirrors the logic of the original utilities/claimpoolfees.js:
 *   1. Reads fee pool + empty-location fees from claimableFees
 *   2. Estimates gas for claimfees()
 *   3. Shows amount, gas cost, asks for confirmation
 *   4. Optionally executes claimfees()
 */

import { ethers } from 'ethers';
import { ICliTool, IToolContext, ToolCategory, createToolProvider, NO_KEY_MESSAGE } from '../types';

/** VDXF key for the notary fee pool */
const VDXF_SYSTEM_NOTARIZATION_NOTARYFEEPOOL =
    '0x00000000000000000000000039aDf7BA6E5c91eeef476Bb4aC9417549ba0d51a';

/** Empty location slot — additional fees stored here */
const EMPTY_LOCATION =
    '0x0100000000000000000000000000000000000000000000000000000000000000';

/**
 * Convert a wei-scale integer to a Verus 8-decimal-place float string.
 * uint64ToVerusFloat from the old utils.js — Verus uses satoshi-like 10^8 units.
 */
function uint64ToVerusFloat(value: bigint): string {
    const SATS = 100_000_000n;
    const whole = value / SATS;
    const frac = value % SATS;
    return `${whole}.${frac.toString().padStart(8, '0')}`;
}

export class ClaimFeesTool implements ICliTool {
    readonly name = 'Claim Pool Fees';
    readonly description = 'Claim accumulated notary pool fees (ETH)';
    readonly category = ToolCategory.FinancialOperations;
    readonly help = [
        'Claims ETH from the notary fee pool held in the bridge contract.',
        '',
        'This collects fees from two pools:',
        '  - Notarization fee pool (VDXF_SYSTEM_NOTARIZATION_NOTARYFEEPOOL)',
        '  - Empty-location overflow slot',
        '',
        'The combined amount is shown before asking for confirmation.',
        'Gas cost for the claim transaction is estimated and displayed.',
    ].join('\n');

    async run(ctx: IToolContext): Promise<void> {
        const inquirer = (await import('inquirer')).default;
        const chalk = (await import('chalk')).default;

        if (!ctx.privateKey) {
            console.log(chalk.yellow('\u26A0 ' + NO_KEY_MESSAGE));
            return;
        }

        const { provider, wallet, delegator } = await createToolProvider(ctx);

        try {
            // 1. Read fee pools
            const [fees1, fees2] = await Promise.all([
                delegator.claimableFees(VDXF_SYSTEM_NOTARIZATION_NOTARYFEEPOOL) as Promise<bigint>,
                delegator.claimableFees(EMPTY_LOCATION) as Promise<bigint>,
            ]);

            const totalFees = fees1 + fees2;
            const feesDisplay = uint64ToVerusFloat(totalFees);

            console.log(`\nClaimable fees: ${chalk.green(feesDisplay)} ETH`);

            if (totalFees === 0n) {
                console.log(chalk.yellow('No fees to claim.'));
                return;
            }

            // 2. Estimate gas
            const gasEstimate = await delegator.claimfees.estimateGas();
            const feeData = await provider.getFeeData();
            const gasPrice = feeData.gasPrice ?? 0n;
            const gasCost = gasEstimate * gasPrice;

            console.log(
                `Gas cost: ${chalk.yellow(ethers.formatEther(gasCost))} ETH ` +
                `(gas price: ${ethers.formatUnits(gasPrice, 'gwei')} gwei)`,
            );

            // 3. Confirm
            const { confirm } = await inquirer.prompt([
                {
                    type: 'confirm',
                    name: 'confirm',
                    message: `Claim ${feesDisplay} ETH in pool fees?`,
                    default: false,
                },
            ]);

            if (!confirm) {
                console.log('Cancelled.');
                return;
            }

            // 4. Execute
            console.log('Submitting claim transaction — please wait...');
            const tx = await delegator.claimfees({ gasLimit: 500_000n });
            console.log(`TX hash: ${tx.hash}`);

            const receipt = await tx.wait(1, 120_000);
            console.log(`Confirmed in block ${receipt.blockNumber}`);
        } finally {
            await provider.destroy();
        }
    }
}

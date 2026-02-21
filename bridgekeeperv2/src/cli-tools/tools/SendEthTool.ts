/**
 * SendEthTool — send ETH from the bridge wallet to an Ethereum address.
 *
 * Mirrors the logic from utilities/sendeth.js:
 *   1. Prompts for recipient address and amount
 *   2. Shows sender, recipient, amount for review
 *   3. Confirms, sends, and waits for confirmation
 */

import { ethers } from 'ethers';
import { ICliTool, IToolContext, ToolCategory, createToolProvider, NO_KEY_MESSAGE } from '../types';

export class SendEthTool implements ICliTool {
    readonly name = 'Send ETH';
    readonly description = 'Send ETH from the bridge wallet to an address';
    readonly category = ToolCategory.FinancialOperations;
    readonly help = [
        'Sends ETH from the configured bridge wallet to any Ethereum address.',
        '',
        'You will be prompted for:',
        '  - Recipient address (0x...)',
        '  - Amount in ETH (e.g. 0.5)',
        '',
        'The tool shows sender address, recipient, and amount for review',
        'before asking for final confirmation.',
    ].join('\n');

    async run(ctx: IToolContext): Promise<void> {
        const inquirer = (await import('inquirer')).default;
        const chalk = (await import('chalk')).default;

        if (!ctx.privateKey) {
            console.log(chalk.yellow('\u26A0 ' + NO_KEY_MESSAGE));
            return;
        }

        const { provider, wallet } = await createToolProvider(ctx);

        try {
            // 1. Show wallet info
            const balance = await provider.getBalance(wallet.address);
            console.log(`\nWallet: ${chalk.cyan(wallet.address)}`);
            console.log(`Balance: ${chalk.green(ethers.formatEther(balance))} ETH`);

            // 2. Prompt for recipient and amount
            const answers = await inquirer.prompt([
                {
                    type: 'input',
                    name: 'address',
                    message: 'Recipient ETH address:',
                    validate: (input: string) => {
                        if (ethers.isAddress(input)) return true;
                        return 'Invalid Ethereum address.';
                    },
                },
                {
                    type: 'input',
                    name: 'amount',
                    message: 'Amount in ETH:',
                    validate: (input: string) => {
                        try {
                            const val = ethers.parseEther(input);
                            if (val <= 0n) return 'Amount must be positive.';
                            return true;
                        } catch {
                            return 'Invalid amount. Enter a number like 0.5 or 1.0';
                        }
                    },
                },
            ]);

            const valueWei = ethers.parseEther(answers.amount);

            if (valueWei > balance) {
                console.log(chalk.red('Insufficient balance.'));
                return;
            }

            // 3. Confirm
            console.log('');
            console.log(`  From:   ${wallet.address}`);
            console.log(`  To:     ${answers.address}`);
            console.log(`  Amount: ${answers.amount} ETH`);
            console.log('');

            const { confirm } = await inquirer.prompt([
                {
                    type: 'confirm',
                    name: 'confirm',
                    message: 'Send transaction?',
                    default: false,
                },
            ]);

            if (!confirm) {
                console.log('Cancelled.');
                return;
            }

            // 4. Execute
            console.log('Submitting transaction — please wait...');
            const tx = await wallet.sendTransaction({
                to: answers.address,
                value: valueWei,
            });
            console.log(`TX hash: ${tx.hash}`);

            const receipt = await tx.wait(1, 120_000);
            console.log(`Confirmed in block ${receipt!.blockNumber}`);
        } finally {
            await provider.destroy();
        }
    }
}

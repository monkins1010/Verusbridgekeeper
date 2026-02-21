/**
 * BurnDaiTool — burn accumulated DAI DSR interest fees back to Bridge.vETH.
 *
 * Mirrors the logic of the original utilities/burndai.js:
 *   1. Reads DAI holdings and DSR supply from claimableFees
 *   2. Reads chi from the MakerDAO Pot contract
 *   3. Computes accrued interest = (dsrSupply * chi / RAY) - daiHoldings
 *   4. Estimates gas, shows cost, checks minimum (1000 DAI) and 24h cooldown
 *   5. Optionally executes burnFees("0x00")
 */

import { ethers } from 'ethers';
import { ICliTool, IToolContext, ToolCategory, createReadOnlyProvider, createToolProvider, NO_KEY_MESSAGE } from '../types';

/** VDXF keys for DAI holdings tracking */
const VDXF_SYSTEM_DAI_HOLDINGS =
    '0x000000000000000000000000334711b41Cf095C9D44d1a209f34bf3559eA7640';
const VDXFID_DAI_DSR_SUPPLY =
    '0x00000000000000000000000084206E821f7bB4c6F390299c1367600F608c28C8';
const VDXFID_TIMESTAMP =
    '0x0000000000000000000000007d6505549c434ef651d799ede5f0d3f698464fcf';

/** MakerDAO DSR Pot contract (mainnet) */
const DSR_POT_CONTRACT = '0x197e90f9fad81970ba7976f33cbd77088e5d7cf7';

/** Minimal ABI for the MakerDAO Pot (chi only) */
const POT_ABI = [
    'function chi() view returns (uint256)',
];

/** CoinGecko ETH price endpoint */
const COINGECKO_ETH_URL = 'https://api.coingecko.com/api/v3/coins/ethereum';

/** RAY = 10^27 — MakerDAO precision unit */
const RAY = 10n ** 27n;

export class BurnDaiTool implements ICliTool {
    readonly name = 'Burn DAI Fees';
    readonly description = 'Burn accumulated DAI DSR fees back to Bridge.vETH';
    readonly category = ToolCategory.FinancialOperations;
    readonly help = [
        'Shows accrued DAI DSR interest fees and optionally burns them.',
        '',
        'Viewing accrued fees works without a private key.',
        'Executing the burn requires a private key in veth.conf.',
        '',
        'Burn requirements:',
        '  - At least 1,000 DAI in accumulated fees',
        '  - At least 24 hours since the last burn',
        '  - Gas cost paid in ETH from your wallet',
    ].join('\n');

    async run(ctx: IToolContext): Promise<void> {
        const inquirer = (await import('inquirer')).default;
        const chalk = (await import('chalk')).default;

        // Use read-only provider to show accrued fees — no key needed
        const { provider, delegator } = await createReadOnlyProvider(ctx);

        try {
            // 1. Read DAI holdings, DSR supply, and chi
            const [daiHoldings, dsrSupply, chi] = await Promise.all([
                delegator.claimableFees(VDXF_SYSTEM_DAI_HOLDINGS) as Promise<bigint>,
                delegator.claimableFees(VDXFID_DAI_DSR_SUPPLY) as Promise<bigint>,
                new ethers.Contract(DSR_POT_CONTRACT, POT_ABI, provider).chi() as Promise<bigint>,
            ]);

            // 2. Compute fees: (dsrSupply * chi / RAY) - daiHoldings
            const daiPlusInterest = (dsrSupply * chi) / RAY;
            const totalFees = daiPlusInterest - daiHoldings;
            const feesEther = ethers.formatEther(totalFees);

            console.log(`\n  DAI Holdings:    ${chalk.cyan(ethers.formatEther(daiHoldings))} DAI`);
            console.log(`  DSR Supply:      ${chalk.cyan(ethers.formatEther(dsrSupply))}`);
            console.log(`  DAI + Interest:  ${chalk.cyan(ethers.formatEther(daiPlusInterest))} DAI`);
            console.log(`  Accrued Fees:    ${chalk.green(feesEther)} DAI`);

            // 3. Check 24h cooldown (read-only)
            const lastBurnTs = await delegator.claimableFees(VDXFID_TIMESTAMP) as bigint;
            if (lastBurnTs > 0n) {
                const lastDate = new Date(Number(lastBurnTs) * 1000).toUTCString();
                console.log(`  Last Burn:       ${chalk.dim(lastDate)}`);

                const twentyFourHoursAgo = BigInt(Math.floor(Date.now() / 1000)) - 86400n;
                if (lastBurnTs > twentyFourHoursAgo) {
                    console.log(chalk.yellow('  Cooldown active — burn allowed once per 24 hours.'));
                }
            }

            // 4. Check minimum
            if (totalFees < ethers.parseEther('1000')) {
                console.log(chalk.yellow('  Below 1,000 DAI minimum — not yet burnable.'));
            }

            // If no private key, stop here after showing the info
            if (!ctx.privateKey) {
                console.log(chalk.yellow('\n\u26A0 ' + NO_KEY_MESSAGE));
                return;
            }
        } finally {
            await provider.destroy();
        }

        // --- Transaction path: requires private key ---
        const { provider: txProvider, wallet, delegator: txDelegator } = await createToolProvider(ctx);

        try {
            // Re-read fees for the transaction (provider changed)
            const [daiHoldings2, dsrSupply2, chi2] = await Promise.all([
                txDelegator.claimableFees(VDXF_SYSTEM_DAI_HOLDINGS) as Promise<bigint>,
                txDelegator.claimableFees(VDXFID_DAI_DSR_SUPPLY) as Promise<bigint>,
                new ethers.Contract(DSR_POT_CONTRACT, POT_ABI, txProvider).chi() as Promise<bigint>,
            ]);

            const totalFees2 = (dsrSupply2 * chi2) / RAY - daiHoldings2;
            const feesEther2 = ethers.formatEther(totalFees2);

            // Check minimum
            if (totalFees2 < ethers.parseEther('1000')) {
                console.log(chalk.red('You need at least 1,000 DAI in fees to burn.'));
                return;
            }

            // Check cooldown
            const lastBurnTs2 = await txDelegator.claimableFees(VDXFID_TIMESTAMP) as bigint;
            const twentyFourHoursAgo2 = BigInt(Math.floor(Date.now() / 1000)) - 86400n;
            if (lastBurnTs2 > twentyFourHoursAgo2) {
                const lastDate = new Date(Number(lastBurnTs2) * 1000).toUTCString();
                console.log(chalk.red(`Burn allowed once per day. Last burn: ${lastDate}`));
                return;
            }

            // Estimate gas
            let gasEstimate: bigint;
            try {
                gasEstimate = await txDelegator.burnFees.estimateGas('0x00');
            } catch {
                console.log(chalk.red('Gas estimation failed — probably too soon after the last burn.'));
                return;
            }

            const feeData = await txProvider.getFeeData();
            const gasPrice = feeData.gasPrice ?? 0n;
            const gasCost = gasEstimate * gasPrice;

            console.log(
                `\nGas cost: ${chalk.yellow(ethers.formatEther(gasCost))} ETH ` +
                `(gas price: ${ethers.formatUnits(gasPrice, 'gwei')} gwei)`,
            );

            // Try to fetch ETH price for USD estimate
            try {
                const res = await fetch(COINGECKO_ETH_URL);
                const data = (await res.json()) as { market_data: { current_price: { usd: number } } };
                const ethPrice = data.market_data.current_price.usd;
                const gasCostEth = parseFloat(ethers.formatEther(gasCost));
                console.log(`Approx gas cost: ~$${chalk.yellow((ethPrice * gasCostEth).toFixed(2))}`);
            } catch {
                // Price fetch is optional
            }

            // Confirm
            const { confirm } = await inquirer.prompt([
                {
                    type: 'confirm',
                    name: 'confirm',
                    message: `Burn ${feesEther2} DAI fees? This will cost ~${ethers.formatEther(gasCost)} ETH in gas.`,
                    default: false,
                },
            ]);

            if (!confirm) {
                console.log('Cancelled.');
                return;
            }

            // Execute
            console.log('Submitting burn transaction — please wait...');
            const tx = await txDelegator.burnFees('0x00', { gasLimit: gasEstimate * 2n });
            console.log(`TX hash: ${tx.hash}`);

            const receipt = await tx.wait(1, 120_000);
            console.log(`Confirmed in block ${receipt.blockNumber}`);
        } finally {
            await txProvider.destroy();
        }
    }
}

#!/usr/bin/env node
/**
 * CLI entry point for the Verus Bridge Keeper.
 *
 * Usage:
 *   npx ts-node src/cli.ts start                  # Start on mainnet (VRSC)
 *   npx ts-node src/cli.ts start --testnet         # Start on testnet (VRSCTEST)
 *   npx ts-node src/cli.ts start --debug           # Start with debug logging
 *   npx ts-node src/cli.ts tools                   # Open interactive tools menu
 *   npx ts-node src/cli.ts tools --testnet         # Tools menu in testnet mode
 */

import { Command } from 'commander';
import { BridgeKeeper } from './index';
import { IBridgeConfig, Ticker } from './types/common';

const program = new Command();

program
    .name('bridgekeeper')
    .description('Verus-Ethereum Bridge Keeper v2')
    .version('2.0.0');

program
    .command('start')
    .description('Start the bridge keeper server')
    .option('-t, --testnet', 'Use VRSCTEST network', false)
    .option('-d, --debug', 'Enable debug logging', false)
    .option('--debug-submit', 'Debug import submissions', false)
    .option('--debug-notarization', 'Debug notarizations', false)
    .option('--no-imports', 'Disable import processing', false)
    .option('--check-hash', 'Enable hash checking', false)
    .option('--console-log', 'Enable timestamped console logging', false)
    .action(async (cmdOpts) => {
        const opts = cmdOpts;
        const ticker: Ticker = opts.testnet ? 'VRSCTEST' : 'VRSC';

        const config: IBridgeConfig = {
            ticker,
            debug: opts.debug,
            debugSubmit: opts.debugSubmit,
            debugNotarization: opts.debugNotarization,
            noImports: opts.noImports === true, // commander inverts --no-imports
            checkHash: opts.checkHash,
            consoleLog: opts.consoleLog,
        };

        console.log(`Starting Bridgekeeper on ${ticker}...`);

        const bridge = new BridgeKeeper();
        const result = await bridge.start(config);

        if (result instanceof Error) {
            console.error('Failed to start:', result.message);
            process.exit(1);
        }

        // Handle graceful shutdown
        const shutdown = async () => {
            console.log('\nShutting down...');
            await bridge.stop();
            process.exit(0);
        };

        process.on('SIGINT', shutdown);
        process.on('SIGTERM', shutdown);

        // Keep the process alive
        process.stdin.resume();
    });

program
    .command('tools')
    .description('Open interactive tools menu')
    .option('-t, --testnet', 'Use VRSCTEST network', false)
    .action(async (cmdOpts) => {
        const ticker: Ticker = cmdOpts.testnet ? 'VRSCTEST' : 'VRSC';

        const { CliMenu } = await import('./cli-tools/index');
        const menu = new CliMenu(ticker);
        await menu.run();
    });

program
    .command('status')
    .description('Check the bridge keeper status')
    .option('-t, --testnet', 'Use VRSCTEST network', false)
    .action(async (cmdOpts) => {
        const ticker: Ticker = cmdOpts.testnet ? 'VRSCTEST' : 'VRSC';

        // For status, we need to make an RPC call to a running instance
        // This is a convenience command that connects to the RPC server
        console.log(`Checking Bridgekeeper status on ${ticker}...`);
        console.log('(Status check requires a running instance — use RPC call to getinfo)');
    });

// Parse args — if no command given, show help
program.parse(process.argv);

if (!process.argv.slice(2).length) {
    program.help();
}

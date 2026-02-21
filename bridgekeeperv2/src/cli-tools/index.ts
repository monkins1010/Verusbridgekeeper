/**
 * CLI Tools — interactive terminal menu for bridge operations.
 */

import { MenuRenderer } from './MenuRenderer';
import { ToolRunner } from './ToolRunner';
import { IToolContext } from './types';
import { createTools } from './tools';
import { ConfigManager } from '../config/ConfigManager';
import { Ticker } from '../types/common';

export class CliMenu {
    private ticker: Ticker;

    constructor(ticker: Ticker = 'VRSC') {
        this.ticker = ticker;
    }

    /** Run the interactive tools menu loop */
    async run(): Promise<void> {
        const configMgr = new ConfigManager(this.ticker);
        const conf = configMgr.load();

        // Build Verus daemon RPC info if available
        let verusDaemonRpc: IToolContext['verusDaemonRpc'] | undefined;
        try {
            const vConf = configMgr.readVerusConf();
            verusDaemonRpc = {
                url: `http://127.0.0.1:${vConf.rpcport}`,
                user: vConf.rpcuser,
                password: vConf.rpcpassword,
            };
        } catch {
            // Verus daemon conf not available — some tools may not work
        }

        const ctx: IToolContext = {
            ticker: this.ticker,
            ethNodeUrl: conf.ethnode,
            delegatorAddress: conf.delegatorcontractaddress,
            privateKey: conf.privatekey || undefined,
            verusDaemonRpc,
        };

        const tools = createTools();
        const renderer = new MenuRenderer(this.ticker, tools);
        const runner = new ToolRunner();

        while (true) {
            const selected = await renderer.showMainMenu();
            if (!selected) {
                console.log('Goodbye!');
                break;
            }
            await runner.run(selected, ctx);
        }
    }
}

export { MenuRenderer } from './MenuRenderer';
export { ToolRunner } from './ToolRunner';
export * from './types';
export * from './tools';

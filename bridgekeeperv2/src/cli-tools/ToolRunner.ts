/**
 * ToolRunner — executes a selected CLI tool with progress display.
 */

import { ICliTool, IToolContext } from './types';

export class ToolRunner {
    /** Run a tool with error handling and return-to-menu flow */
    async run(tool: ICliTool, ctx: IToolContext): Promise<void> {
        const chalk = (await import('chalk')).default;

        console.log(`\n${chalk.blue('▶')} Running: ${chalk.bold(tool.name)}`);
        console.log(chalk.dim(tool.help));
        console.log('');

        try {
            await tool.run(ctx);
            console.log(`\n${chalk.green('✓')} ${tool.name} completed successfully.\n`);
        } catch (err: unknown) {
            const message = err instanceof Error ? err.message : String(err);
            console.error(`\n${chalk.red('✗')} Error: ${message}\n`);
        }

        // Pause before returning to menu
        const inquirer = (await import('inquirer')).default;
        await inquirer.prompt([
            {
                type: 'input',
                name: 'continue',
                message: 'Press Enter to return to menu...',
            },
        ]);
    }
}

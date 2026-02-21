/**
 * MenuRenderer — terminal UI for the interactive tools menu.
 * Uses inquirer, chalk, and boxen for styled terminal output.
 */

import { ICliTool, ToolCategory } from './types';

export class MenuRenderer {
    private ticker: string;
    private tools: ICliTool[];

    constructor(ticker: string, tools: ICliTool[]) {
        this.ticker = ticker;
        this.tools = tools;
    }

    /** Show the main menu and return the selected tool (or null for exit) */
    async showMainMenu(): Promise<ICliTool | null> {
        // Dynamic imports for ESM-only packages
        const chalk = (await import('chalk')).default;
        const boxen = (await import('boxen')).default;
        const inquirer = (await import('inquirer')).default;

        console.clear();
        console.log(
            boxen(
                chalk.bold('Verus Bridge Keeper Tools\n') +
                    chalk.dim(`${this.ticker} network`),
                {
                    padding: 1,
                    borderStyle: 'double',
                    borderColor: 'blue',
                },
            ),
        );

        // Group tools by category
        const categories = Object.values(ToolCategory);
        const choices: Array<{ name: string; value: string }> = [];

        for (const category of categories) {
            const categoryTools = this.tools.filter((t) => t.category === category);
            if (categoryTools.length > 0) {
                choices.push(new inquirer.Separator(`--- ${category} ---`) as any);
                for (const tool of categoryTools) {
                    choices.push({
                        name: `  ${tool.name} — ${tool.description}`,
                        value: tool.name,
                    });
                }
            }
        }

        choices.push(new inquirer.Separator() as any);
        choices.push({ name: chalk.red('Exit'), value: '__exit__' });

        const { choice } = await inquirer.prompt([
            {
                type: 'list',
                name: 'choice',
                message: 'Select a tool:',
                choices,
                pageSize: 20,
            },
        ]);

        if (choice === '__exit__') return null;
        return this.tools.find((t) => t.name === choice) ?? null;
    }
}

/**
 * Tool registry — exports all available CLI tools.
 */

import { ICliTool } from '../types';
import { UpgradeTool } from './UpgradeTool';
import { IdentityTool } from './IdentityTool';
import { SendEthTool } from './SendEthTool';
import { BurnDaiTool } from './BurnDaiTool';
import { ClaimFeesTool } from './ClaimFeesTool';
import { DiagnosticsTool } from './DiagnosticsTool';

/** Create all CLI tools */
export function createTools(): ICliTool[] {
    return [
        new UpgradeTool(),
        new IdentityTool(),
        new SendEthTool(),
        new BurnDaiTool(),
        new ClaimFeesTool(),
        new DiagnosticsTool(),
    ];
}

export { UpgradeTool } from './UpgradeTool';
export { IdentityTool } from './IdentityTool';
export { SendEthTool } from './SendEthTool';
export { BurnDaiTool } from './BurnDaiTool';
export { ClaimFeesTool } from './ClaimFeesTool';
export { DiagnosticsTool } from './DiagnosticsTool';

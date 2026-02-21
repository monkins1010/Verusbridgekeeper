/**
 * Handler registry — creates and registers all RPC handlers.
 */

import { IRpcHandler } from '../../server/types';
import { IHandlerDependencies } from './types';
import { GetInfoHandler } from './GetInfoHandler';
import { GetCurrencyHandler } from './GetCurrencyHandler';
import { GetExportsHandler } from './GetExportsHandler';
import { GetBestProofRootHandler } from './GetBestProofRootHandler';
import { GetNotarizationDataHandler } from './GetNotarizationDataHandler';
import { SubmitImportsHandler } from './SubmitImportsHandler';
import { SubmitNotarizationHandler } from './SubmitNotarizationHandler';
import { GetLastImportFromHandler } from './GetLastImportFromHandler';
import { GetClaimableFeesHandler } from './GetClaimableFeesHandler';
import { RevokeIdentityHandler } from './RevokeIdentityHandler';

/** Create all RPC handlers with their shared dependencies */
export function createHandlers(deps: IHandlerDependencies): IRpcHandler[] {
    return [
        new GetInfoHandler(deps),
        new GetCurrencyHandler(deps),
        new GetExportsHandler(deps),
        new GetBestProofRootHandler(deps),
        new GetNotarizationDataHandler(deps),
        new SubmitImportsHandler(deps),
        new SubmitNotarizationHandler(deps),
        new GetLastImportFromHandler(deps),
        new GetClaimableFeesHandler(deps),
        new RevokeIdentityHandler(deps),
    ];
}

export { GetInfoHandler } from './GetInfoHandler';
export { GetCurrencyHandler } from './GetCurrencyHandler';
export { GetExportsHandler } from './GetExportsHandler';
export { GetBestProofRootHandler } from './GetBestProofRootHandler';
export { GetNotarizationDataHandler } from './GetNotarizationDataHandler';
export { SubmitImportsHandler } from './SubmitImportsHandler';
export { SubmitNotarizationHandler } from './SubmitNotarizationHandler';
export { GetLastImportFromHandler } from './GetLastImportFromHandler';
export { GetClaimableFeesHandler } from './GetClaimableFeesHandler';
export { RevokeIdentityHandler } from './RevokeIdentityHandler';
export * from './types';

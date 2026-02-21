/**
 * ExportBuilder — high-level helper for constructing cross-chain export data structures.
 *
 * Wraps the lower-level {@link CrossChainExportCodec} and {@link TransferConditioner}
 * to produce complete export payloads from raw transfers.
 *
 * In the current architecture the bulk of export building happens inline in
 * {@link GetExportsHandler}. This class provides a reusable, standalone API
 * for callers that need to build exports outside the handler flow.
 */

import { CrossChainExportCodec, ICrossChainExport } from '../../serialization/CrossChainExportCodec';
import { TransferConditioner } from './TransferConditioner';
import { IOutboundExport, IConditionedTransfer } from './types';

export class ExportBuilder {
    private conditioner: TransferConditioner;

    constructor() {
        this.conditioner = new TransferConditioner();
    }

    /**
     * Build an outbound cross-chain export from pending transfers.
     *
     * Each raw transfer is conditioned (address conversion, fee normalisation)
     * then the totals are computed.
     *
     * @param transfers - Raw transfer objects from the contract or Verus daemon
     * @param height    - Block height to stamp on the export
     * @returns An {@link IOutboundExport} with conditioned transfers and fee totals
     */
    buildExport(transfers: unknown[], height: number): IOutboundExport {
        const conditioned: IConditionedTransfer[] = transfers.map((t) =>
            this.conditioner.condition(t),
        );

        // Aggregate total fees by currency
        const totalFees: Record<string, bigint> = {};
        for (const ct of conditioned) {
            for (const [currency, amount] of Object.entries(ct.currencyValues)) {
                totalFees[currency] = (totalFees[currency] ?? 0n) + amount;
            }
        }

        return { height, transfers: conditioned, totalFees };
    }

    /**
     * Serialize a cross-chain export structure to hex for contract submission.
     *
     * @param exportData - A full {@link ICrossChainExport} object
     * @returns 0x-prefixed hex string
     */
    serializeExport(exportData: ICrossChainExport): string {
        return CrossChainExportCodec.serialize(exportData);
    }
}

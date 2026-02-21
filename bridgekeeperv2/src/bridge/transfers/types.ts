/**
 * Transfer-related type definitions.
 */

/** Conditioned transfer ready for submission */
export interface IConditionedTransfer {
    serializedTransfer: string;
    destinationAddress: string;
    currencyValues: Record<string, bigint>;
    flags: number;
}

/** Outbound cross-chain export data */
export interface IOutboundExport {
    height: number;
    transfers: IConditionedTransfer[];
    totalFees: Record<string, bigint>;
}

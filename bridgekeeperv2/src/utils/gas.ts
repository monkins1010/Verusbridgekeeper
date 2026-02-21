/**
 * Gas price calculation with fork-height-dependent logic.
 * Bridge-specific — not covered by verus-typescript-primitives.
 */

import { Ticker } from '../types/common';
import {
    TESTNET_ETH_GAS_REDUCTION_HEIGHT,
    ETH_GAS_REDUCTION_HEIGHT,
    TESTNET_ETH_GAS_REDUCTION_HEIGHT2,
    ETH_GAS_REDUCTION_HEIGHT2,
    TESTNET_ETH_GAS_REDUCTION_HEIGHT3,
    ETH_GAS_REDUCTION_HEIGHT3,
} from '../config/constants';

/** Calculate the gas price for a given block height and network */
export function calculateGasPrice(
    blockHeight: number,
    baseGasPrice: bigint,
    ticker: Ticker,
): bigint {
    const forkHeight1 = ticker === 'VRSCTEST'
        ? TESTNET_ETH_GAS_REDUCTION_HEIGHT
        : ETH_GAS_REDUCTION_HEIGHT;

    const forkHeight2 = ticker === 'VRSCTEST'
        ? TESTNET_ETH_GAS_REDUCTION_HEIGHT2
        : ETH_GAS_REDUCTION_HEIGHT2;

    const forkHeight3 = ticker === 'VRSCTEST'
        ? TESTNET_ETH_GAS_REDUCTION_HEIGHT3
        : ETH_GAS_REDUCTION_HEIGHT3;

    let gasPrice = baseGasPrice;

    // Apply reductions based on fork heights
    if (blockHeight >= forkHeight3) {
        gasPrice = gasPrice / 4n;
    } else if (blockHeight >= forkHeight2) {
        gasPrice = gasPrice / 2n;
    } else if (blockHeight >= forkHeight1) {
        // First reduction fork — no change from base in original code
    }

    return gasPrice;
}

/** Convert gas price to the format expected by the bridge contract */
export function gasPriceToHex(gasPrice: bigint): string {
    return '0x' + gasPrice.toString(16);
}

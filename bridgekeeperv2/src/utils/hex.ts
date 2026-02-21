/**
 * Hex string utilities — thin wrappers for common hex operations.
 */

/** Ensure a hex string has 0x prefix */
export function addHexPrefix(hex: string): string {
    if (hex.startsWith('0x') || hex.startsWith('0X')) {
        return hex;
    }
    return '0x' + hex;
}

/** Remove 0x prefix from a hex string */
export function removeHexPrefix(hex: string): string {
    if (hex.startsWith('0x') || hex.startsWith('0X')) {
        return hex.slice(2);
    }
    return hex;
}

/** Reverse bytes in a hex string (e.g., for little-endian conversion) */
export function reverseHex(hex: string): string {
    const clean = removeHexPrefix(hex);
    const bytes = clean.match(/.{2}/g);
    if (!bytes) return clean;
    return bytes.reverse().join('');
}

/** Pad a hex string to a specific byte length */
export function padHex(hex: string, byteLength: number): string {
    const clean = removeHexPrefix(hex);
    return clean.padStart(byteLength * 2, '0');
}

/** Convert a number to a hex string with 0x prefix */
export function numberToHex(num: number | bigint): string {
    return '0x' + num.toString(16);
}

/** Convert a hex string to a number */
export function hexToNumber(hex: string): number {
    return parseInt(removeHexPrefix(hex), 16);
}

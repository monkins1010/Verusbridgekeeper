/**
 * Utils barrel export.
 * Re-exports bridge-specific utilities + relevant verus-typescript-primitives utils.
 */

// Bridge-specific utils
export * from './crypto';
export * from './gas';
export * from './hex';

// Re-export commonly used primitives utils for convenience
// NOTE: These will resolve once verus-typescript-primitives is installed
// import { fromBase58Check, toBase58Check } from 'verus-typescript-primitives';
// import bufferutils from 'verus-typescript-primitives/utils/bufferutils';
// export { fromBase58Check, toBase58Check };
// export const { BufferReader, BufferWriter } = bufferutils;

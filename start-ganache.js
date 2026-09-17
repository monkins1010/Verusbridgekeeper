'use strict';
/**
 * start-ganache.js
 *
 * Starts Verus Bridgekeeper in VRSCTEST mode pointed at a local Ganache instance.
 * Ganache settings are passed in memory and never written to the VRSCTEST
 * configuration file.
 *
 * Expected Ganache settings:
 *   RPC / WS : ws://127.0.0.1:8545   (Ganache v7 serves HTTP + WS on the same port)
 *   Chain ID : 1337
 *   Hardfork : London
 *   Delegator: 0xFC628dd79137395F3C9744e33b1c5DE554D94882
 */

// ─── Ganache connection settings ────────────────────────────────────────────
const GANACHE = {
    ethnode:                  'ws://127.0.0.1:8545',
    delegatorcontractaddress: '0xFC628dd79137395F3C9744e33b1c5DE554D94882',
    // Private key WITHOUT 0x prefix — must be exactly 64 hex chars
    privatekey:               '4f3edf983ac636a65a842ce7c78d9aa706d3b113bce9c46f30d7d21715b23b1d',
    rpcuser:                  'user123',
    rpcpassword:              'pass123',
    rpcport:                  '8000',
    rpchost:                  '127.0.0.1',
    rpcallowip:               '127.0.0.1',
    nowitnesssubmissions:     'false',
};

// ─── Start server ─────────────────────────────────────────────────────────────
const server = require('./index');

server.start({ ticker: 'VRSCTEST', runtimeSettings: GANACHE })
    .then(() => {
        console.log('[ganache-start] Bridgekeeper running against local Ganache (VRSCTEST / Chain 1337)');
    })
    .catch(e => {
        console.error('[ganache-start] Failed to start:', e.message || e);
        process.exit(1);
    });

'use strict';
/**
 * start-ganache.js
 *
 * Starts Verus Bridgekeeper in VRSCTEST mode pointed at a local Ganache instance.
 * Writes the VRSCTEST conf file with Ganache settings before boot so that the
 * existing confFile.loadConfFile() machinery picks them up transparently.
 *
 * Expected Ganache settings:
 *   RPC / WS : ws://127.0.0.1:8545   (Ganache v7 serves HTTP + WS on the same port)
 *   Chain ID : 1337
 *   Hardfork : London
 *   Delegator: 0xFC628dd79137395F3C9744e33b1c5DE554D94882
 */

const path = require('path');
const fs   = require('fs');
const os   = require('os');

// ─── Ganache connection settings ────────────────────────────────────────────
const GANACHE = {
    ethnode:                  'ws://127.0.0.1:8545',
    delegatorcontractaddress: '0xFC628dd79137395F3C9744e33b1c5DE554D94882',
    // Private key WITHOUT 0x prefix — must be exactly 64 hex chars
    privatekey:               '4f3edf983ac636a65a842ce7c78d9aa706d3b113bce9c46f30d7d21715b23b1d',
    rpcuser:                  'user123',
    rpcpassword:              'pass123',
    rpcport:                  '8000',
    rpcallowip:               '127.0.0.1',
    nowitnesssubmissions:     'false',
};

// ─── VRSCTEST conf file path (mirrors confFile.js rootPath() logic) ──────────
//   ID = VETHIDHEXREVERSED.VRSCTEST from constants.js
const VETHID   = '000b090bec6c9ff28586eb7ed24e77562f0c4667';
const homeDir  = os.homedir();

let confDir;
switch (os.platform()) {
    case 'darwin':
        confDir = path.join(homeDir, 'Library', 'Application Support', 'VerusTest', 'pbaas', VETHID);
        break;
    case 'win32':
        confDir = path.join(process.env.APPDATA, 'VerusTest', 'pbaas', VETHID);
        break;
    default: // linux
        confDir = path.join(homeDir, '.verustest', 'pbaas', VETHID);
}

const confFilePath = path.join(confDir, `${VETHID}.conf`);

// ─── Write conf file ─────────────────────────────────────────────────────────
function writeGanacheConf() {
    fs.mkdirSync(confDir, { recursive: true });
    const content = Object.entries(GANACHE)
        .map(([k, v]) => `${k}=${v}`)
        .join('\n') + '\n';
    fs.writeFileSync(confFilePath, content, 'utf8');
    console.log(`[ganache-start] Conf written : ${confFilePath}`);
}

writeGanacheConf();

// ─── Start server ─────────────────────────────────────────────────────────────
const server = require('./index');

server.start({ ticker: 'VRSCTEST' })
    .then(() => {
        console.log('[ganache-start] Bridgekeeper running against local Ganache (VRSCTEST / Chain 1337)');
    })
    .catch(e => {
        console.error('[ganache-start] Failed to start:', e.message || e);
        process.exit(1);
    });

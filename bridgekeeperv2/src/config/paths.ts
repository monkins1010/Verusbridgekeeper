/**
 * OS-specific path resolution for Verus and PBaaS configuration files.
 */

import * as os from 'os';
import * as path from 'path';
import { Ticker } from '../types/common';
import { CHAIN_CONFIG } from './constants';

/** Get the OS-specific root path for PBaaS chain data */
export function getPbaasRootPath(ticker: Ticker): string {
    const homeDir = os.homedir();
    const platform = os.platform();

    const pbaasRoots: Record<string, Record<string, string>> = {
        VRSC: {
            darwin: '/Library/Application Support/Komodo/VRSC/pbaas/',
            linux: '/.komodo/VRSC/pbaas/',
            win32: '\\Komodo\\VRSC\\pbaas\\',
        },
        VRSCTEST: {
            darwin: '/Library/Application Support/VerusTest/pbaas/',
            linux: '/.verustest/pbaas/',
            win32: '\\VerusTest\\pbaas\\',
        },
    };

    const roots = pbaasRoots[ticker];
    if (!roots) throw new Error(`Unknown ticker: ${ticker}`);

    const platformKey = platform as string;
    if (!roots[platformKey]) throw new Error(`Unsupported platform: ${platform}`);

    if (platform === 'win32') {
        const appData = process.env.APPDATA || homeDir;
        return path.normalize(appData + roots.win32);
    }

    if (platform === 'darwin') {
        return homeDir + roots.darwin;
    }

    return homeDir + roots.linux;
}

/** Get the full conf file path for a given ticker's veth chain */
export function getConfFilePath(ticker: Ticker): string {
    const chainId = CHAIN_CONFIG.VETH_ID_HEX_REVERSED[ticker];
    const rootPath = getPbaasRootPath(ticker);
    return path.join(rootPath, chainId, `${chainId}.conf`);
}

/** Get the Verus daemon conf file path */
export function getVerusConfPath(ticker: Ticker): string {
    const homeDir = os.homedir();
    const platform = os.platform();

    const confPaths: Record<string, Record<string, string>> = {
        VRSC: {
            darwin: '/Library/Application Support/Komodo/VRSC/VRSC.conf',
            linux: '/.komodo/VRSC/VRSC.conf',
            win32: '\\Komodo\\VRSC\\VRSC.conf',
        },
        VRSCTEST: {
            darwin: '/Library/Application Support/VerusTest/VRSCTEST.conf',
            linux: '/.verustest/VRSCTEST.conf',
            win32: '\\VerusTest\\VRSCTEST.conf',
        },
    };

    const paths = confPaths[ticker];
    if (!paths) throw new Error(`Unknown ticker: ${ticker}`);

    const platformKey = platform as string;
    if (!paths[platformKey]) throw new Error(`Unsupported platform: ${platform}`);

    if (platform === 'win32') {
        const appData = process.env.APPDATA || homeDir;
        return path.normalize(appData + paths.win32);
    }

    if (platform === 'darwin') {
        return homeDir + paths.darwin;
    }

    return homeDir + paths.linux;
}

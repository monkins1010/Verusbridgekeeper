/**
 * ConfigManager — loads, validates, and persists the veth.conf configuration file.
 * Provides typed access to all bridge configuration values.
 */

import * as fs from 'fs';
import * as path from 'path';
import * as ini from 'ini';
import { randomBytes } from 'crypto';
import { Ticker } from '../types/common';
import { IConfFile } from './types';
import { getConfFilePath, getVerusConfPath } from './paths';
import { CHAIN_CONFIG } from './constants';

export class ConfigManager {
    private _ticker: Ticker;
    private _config: IConfFile | null = null;

    constructor(ticker: Ticker) {
        this._ticker = ticker;
    }

    get ticker(): Ticker {
        return this._ticker;
    }

    get config(): IConfFile {
        if (!this._config) {
            throw new Error('Config not loaded. Call load() first.');
        }
        return this._config;
    }

    get ethNodeUrl(): string {
        return this.config.ethnode;
    }

    get delegatorAddress(): string {
        return this.config.delegatorcontractaddress;
    }

    get privateKey(): string {
        return this.config.privatekey;
    }

    get rpcPort(): number {
        return parseInt(this.config.rpcport, 10);
    }

    get rpcUserPass(): string {
        return `${this.config.rpcuser}:${this.config.rpcpassword}`;
    }

    get rpcAllowIp(): string {
        return this.config.rpcallowip || '127.0.0.1';
    }

    get noWitnessSubmissions(): boolean {
        return this.config.nowitnesssubmissions === 'true';
    }

    get hasPrivateKey(): boolean {
        return !!this.config.privatekey && this.config.privatekey.length === 64;
    }

    /** Load configuration from the conf file. Creates defaults if missing. */
    load(): IConfFile {
        const confPath = getConfFilePath(this._ticker);
        const confDir = path.dirname(confPath);

        // Ensure directory exists
        if (!fs.existsSync(confDir)) {
            fs.mkdirSync(confDir, { recursive: true });
        }

        // Read existing file or create defaults
        let data = '';
        try {
            data = fs.readFileSync(confPath, 'utf8');
        } catch (err: unknown) {
            if ((err as NodeJS.ErrnoException).code !== 'ENOENT') {
                throw err;
            }
        }

        if (data.length > 0) {
            console.log(`Config file found at: ${confPath}`);
            const parsed = this.parseConfFile(data);
            this._config = parsed;
        } else {
            // Write defaults and instruct user to configure
            const defaults = this.getDefaults();
            this.writeConfFile(confPath, defaults);
            console.log(`Default config created at: ${path.normalize(confPath)}`);
            console.log('Please update the config file with your settings and restart.');
            this._config = defaults;
        }

        return this._config;
    }

    /** Parse a veth.conf-style ini file into typed config */
    private parseConfFile(data: string): IConfFile {
        const config = ini.parse(data);

        return {
            rpcuser: config.rpcuser || '',
            rpcpassword: config.rpcpassword || '',
            rpcport: config.rpcport || (this._ticker === 'VRSCTEST' ? '8002' : '8000'),
            rpchost: config.rpchost || '127.0.0.1',
            rpcallowip: config.rpcallowip || '127.0.0.1',
            ethnode: config.ethnode || '',
            delegatorcontractaddress: config.delegatorcontractaddress || '',
            privatekey: config.privatekey || '',
            nowitnesssubmissions: config.nowitnesssubmissions,
        };
    }

    /** Get default config values for a new installation */
    private getDefaults(): IConfFile {
        return {
            rpcuser: randomBytes(16).toString('hex'),
            rpcpassword: randomBytes(32).toString('hex'),
            rpcport: this._ticker === 'VRSCTEST' ? '8002' : '8000',
            rpchost: '127.0.0.1',
            rpcallowip: '127.0.0.1',
            ethnode: 'wss://your-eth-node-url',
            delegatorcontractaddress: '',
            privatekey: '',
        };
    }

    /** Write config to a conf file in key=value format */
    private writeConfFile(filePath: string, config: IConfFile): void {
        const dir = path.dirname(filePath);
        if (!fs.existsSync(dir)) {
            fs.mkdirSync(dir, { recursive: true });
        }

        const lines = Object.entries(config)
            .filter(([_, value]) => value !== undefined)
            .map(([key, value]) => `${key}=${value}`)
            .join('\n');

        fs.writeFileSync(filePath, lines + '\n', 'utf8');
    }

    /** Update specific config values and persist */
    update(updates: Partial<IConfFile>): void {
        if (!this._config) {
            this.load();
        }

        Object.assign(this._config!, updates);

        const confPath = getConfFilePath(this._ticker);
        this.writeConfFile(confPath, this._config!);
    }

    /** Read the Verus daemon conf to get its RPC credentials */
    readVerusConf(): { rpcuser: string; rpcpassword: string; rpcport: string } {
        const confPath = getVerusConfPath(this._ticker);
        const data = fs.readFileSync(confPath, 'utf8');

        if (!data.length) {
            throw new Error('No data in Verus conf file');
        }

        const config = ini.parse(data);
        return {
            rpcuser: config.rpcuser,
            rpcpassword: config.rpcpassword,
            rpcport: config.rpcport,
        };
    }
}

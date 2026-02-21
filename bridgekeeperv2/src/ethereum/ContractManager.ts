/**
 * ContractManager — loads and manages ethers.js Contract instances.
 * Replaces contract initialization from ethInteractor.js.
 */

import { ethers } from 'ethers';
import * as fs from 'fs';
import * as path from 'path';
import { EthereumProvider } from './EthereumProvider';
import { IDelegatorContracts } from './types';
import { ContractType } from '../config/constants';

export class ContractManager {
    private provider: EthereumProvider;
    private delegatorAddress: string;
    private delegatorContract: ethers.Contract | null = null;
    private subContracts: Map<ContractType, ethers.Contract> = new Map();
    private delegatorAbi: ethers.InterfaceAbi | null = null;

    constructor(provider: EthereumProvider, delegatorAddress: string) {
        this.provider = provider;
        this.delegatorAddress = delegatorAddress;
    }

    /** Initialize the delegator contract and load sub-contract addresses */
    async initialize(): Promise<void> {
        this.delegatorAbi = this.loadAbi('VerusDelegator.json');
        this.delegatorContract = new ethers.Contract(
            this.delegatorAddress,
            this.delegatorAbi,
            this.provider.getWallet(),
        );
    }

    /** Get the main delegator contract */
    getDelegator(): ethers.Contract {
        if (!this.delegatorContract) {
            throw new Error('ContractManager not initialized. Call initialize() first.');
        }
        return this.delegatorContract;
    }

    /** Get a read-only contract instance (connected to provider, not wallet) */
    getDelegatorReadOnly(): ethers.Contract {
        if (!this.delegatorAbi) {
            throw new Error('ContractManager not initialized. Call initialize() first.');
        }
        return new ethers.Contract(
            this.delegatorAddress,
            this.delegatorAbi,
            this.provider.getProvider(),
        );
    }

    /** Load ABI JSON from the abi/ directory */
    private loadAbi(filename: string): ethers.InterfaceAbi {
        const abiPath = path.resolve(__dirname, '../../abi', filename);
        const raw = fs.readFileSync(abiPath, 'utf8');
        return JSON.parse(raw);
    }

    /** Query delegator for its sub-contract addresses */
    async getContractAddresses(): Promise<IDelegatorContracts> {
        const delegator = this.getDelegator();
        const addresses: IDelegatorContracts = {
            tokenManager: '',
            verusSerializer: '',
            verusProof: '',
            verusCrossChainExport: '',
            verusNotarizer: '',
            createExport: '',
            verusNotaryTools: '',
            exportManager: '',
            submitImports: '',
            notarizationSerializer: '',
            upgradeManager: '',
        };

        // Query each sub-contract address from the delegator
        const contractTypes = Object.values(ContractType).filter(
            (v) => typeof v === 'number' && v < ContractType.LastIndex,
        ) as ContractType[];

        for (const type of contractTypes) {
            try {
                const addr = await delegator.contracts(type);
                const key = ContractType[type];
                if (key) {
                    const propName = key.charAt(0).toLowerCase() + key.slice(1);
                    if (propName in addresses) {
                        (addresses as unknown as Record<string, string>)[propName] = addr;
                    }
                }
            } catch {
                // Sub-contract may not exist yet
            }
        }

        return addresses;
    }
}

# Task 1 — Verus Bridgekeeper Rewrite Plan

## 1. Current Codebase Analysis

### Entry Point Flow

```
start.js  →  index.js (exports.start)  →  ethInteractor.init()  →  HTTP server listens
              │                                │
              │                                ├── confFile.loadConfFile()   (read veth.conf)
              │                                ├── Web3 provider connect     (WebSocket)
              │                                ├── cache init                (api + block caches)
              │                                └── eventListener()           (subscribe to logs + blocks)
              │
              └── HTTP server receives POST from Verus daemon
                  │
                  ├── Auth check (user:pass + IP)
                  ├── async.queue (concurrency 1)
                  ├── apiFunctions.APIs(command) → maps RPC method name → ethInteractor function
                  └── ethInteractor[fn](params) → calls Ethereum / returns cached data
```

### Current File Responsibilities

| File | Lines | Role |
|------|------:|------|
| `index.js` | 212 | HTTP RPC server, auth, request queue, start/stop/status exports |
| `ethInteractor.js` | 1,809 | **Monolith** — all Ethereum interaction, serialization, business logic, 12+ exported API handlers |
| `apiFunctions.js` | 30 | Maps RPC command strings → handler function names |
| `confFile.js` | 216 | Read/write veth.conf, OS path resolution |
| `setup.js` | ~100 | Default config values, path templates |
| `constants.js` | 133 | Chain IDs, flags, fork heights, gas limits |
| `utils.js` | 602 | Address conversion, binary serialization, math, crypto helpers |
| `deserializer.js` | 448 | Binary deserialization of Verus blockchain data structures |
| `notarization.js` | 183 | Convert contract notarization data → Verus JSON format |
| `cache/apicalls.js` | 170 | In-memory cache (react-native-cache) for API/block/import data |
| `utilities/notarizationSerializer.js` | ~500 | Serialize/deserialize notarization objects + test data |
| `utilities/upgrade.js` | ~400 | CLI: contract upgrades, identity revoke/recover, multisig |
| `utilities/sendeth.js` | ~80 | CLI: send ETH from configured wallet |
| `utilities/burndai.js` | ~150 | CLI: burn DAI DSR interest fees |
| `utilities/claimpoolfees.js` | ~80 | CLI: claim notary pool fees |
| `utilities/getcontractdai.js` | ~120 | CLI: check DAI DSR balances |
| `utilities/getnotariesbalance.js` | ~30 | CLI: query notary fee pool balance |
| `utilities/convert.js` | ~10 | CLI: base58 → hex address conversion |

### Key Problems in Current Codebase

1. **`ethInteractor.js` is a 1,800-line monolith** — mixes provider management, API handlers, serialization, caching, gas logic, and transaction submission
2. **No TypeScript** — no type safety on complex blockchain data structures
3. **web3.js dependency** — older library; ethers.js is more modern, lighter, better typed
4. **Global mutable state** — `web3`, `provider`, `account`, `settings`, `delegatorContract` are module-level variables
5. **Utilities are standalone scripts** — users must run `node utilities/sendeth.js -address ...` manually with cryptic flags
6. **Cache is `react-native-cache`** — an odd choice for a Node.js server; no TTL, no typed keys
7. **No tests** — no test framework or test files
8. **Mixed serialization** — serialization logic is split across `utils.js`, `ethInteractor.js`, and `notarizationSerializer.js`
9. **String.prototype mutation** — `reversebytes()` added to String prototype globally
10. **Hand-rolled serialization** — `utils.js` and `ethInteractor.js` manually serialize `CTransferDestination`, `CCurrencyValueMap`, `CReserveTransfer`, etc. with raw Buffer operations — but a canonical typed library already exists

---

## 1.5. Existing Library: `verus-typescript-primitives`

The [verus-typescript-primitives](https://github.com/VerusCoin/verus-typescript-primitives) library (cloned at `newbridge/references/verus-typescript-primitives`) already provides **typed, tested TypeScript classes** for most of the Verus data structures we currently serialize by hand. This is a major accelerator — we should use it as a dependency rather than rewriting these primitives.

### What the Library Provides

**Package:** `verus-typescript-primitives` v1.0.0 — deps: `bn.js`, `bs58check`, `blake2b`, `create-hash`, `bech32`, `base64url`

#### PBaaS Serializable Classes (`src/pbaas/`) — 35+ classes

Each class implements `SerializableEntity` with `toBuffer()` / `fromBuffer()` and many also have `toJson()` / `fromJson()`:

| Class | Current Bridgekeeper Equivalent | Replaces |
|-------|-------------------------------|----------|
| `ReserveTransfer` | `serializeCReserveTransfers()` in ethInteractor.js | **Yes — direct replacement** |
| `TransferDestination` | `serializeCTransferDestination()` in ethInteractor.js + utils.js | **Yes — direct replacement** |
| `CurrencyValueMap` | `serializeCCurrencyValueMapArray()` in utils.js | **Yes — direct replacement** |
| `TokenOutput` | Manual version+values serialization | **Yes — direct replacement** |
| `CrossChainProof` | `serializeEthFullProof()` in ethInteractor.js | **Partial — ETH proof format is bridge-specific** |
| `Identity` | `revokeidentity`/`recoverID` in upgrade.js | **Use for identity ops** |
| `OptCCParams` | Manual CryptoCondition param building | **Yes — direct replacement** |
| `SignatureData` | `splitSignature()`/`encodeSignatures()` in utils.js | **Evaluate** |
| `MMR` / `MMRProof` / `MMRBranch` | `deSerializeMMR()` in deserializer.js | **Yes — direct replacement** |
| `PartialMMRData` | Partial proof extraction in deserializer.js | **Yes — direct replacement** |
| `ContentMultiMap` | N/A | Available for future features |
| `DataDescriptor` | N/A | Available |

**Also exported:** `IdentityID`, `KeyID`, `Principal`, `PubKey`, `Credential`, `SaltedData`, `CrossChainDataRef`, `EvidenceData`, `PBaaSEvidenceRef`, `PartialIdentity`, `PartialSignData`, `MMRDescriptor`, `Rating`, `URLRef`, `UTXORef`, `VdxfUniValue`, and more.

#### Utility Functions (`src/utils/`)

| Utility | Current Bridgekeeper Equivalent | Replaces |
|---------|-------------------------------|----------|
| `BufferReader` / `BufferWriter` | Manual `Buffer.concat` + `writeUInt` in utils.js | **Yes** |
| `varint` (signed VarInt) | `writeVarInt()` / `readVarInt()` in utils.js | **Yes** |
| `varuint` (CompactSize) | `writeCompactSize()` / `readCompactInt()` in utils.js/deserializer.js | **Yes** |
| `fromBase58Check` / `toBase58Check` | `bitgo-utxo-lib` address functions | **Yes — drop bitgo-utxo-lib** |
| `hash` (SHA256d) / `hash160` | Crypto functions in utils.js | **Yes** |
| `GetMMRProofIndex` | `GetMMRProofIndex()` in utils.js | **Yes** |
| `bnToDecimal` / `decimalToBn` | `uint64ToVerusFloat()` / `convertToInt64()` | **Yes** |

#### Constants (`src/constants/`)

- Address versions: `I_ADDR_VERSION` (102), `R_ADDR_VERSION` (60)
- `HASH160_BYTE_LENGTH` (20)
- Hash types: Blake2b, Keccak256, SHA256
- VDXF keys and data types
- Eval codes and OP codes

#### API Types (`src/api/`) — 26 RPC command request/response pairs

Request/response classes for Verus RPC calls (e.g., `GetIdentityRequest`/`GetIdentityResponse`, `SendCurrencyRequest`, `SignDataRequest`, etc.). These may be useful when the bridge communicates with the Verus daemon.

#### Reserve Transfer Flags (already defined as constants)

```typescript
// All from verus-typescript-primitives/src/pbaas/ReserveTransfer.ts
RESERVE_TRANSFER_VALID, RESERVE_TRANSFER_CONVERT, RESERVE_TRANSFER_PRECONVERT,
RESERVE_TRANSFER_FEE_OUTPUT, RESERVE_TRANSFER_CROSS_SYSTEM, RESERVE_TRANSFER_RESERVE_TO_RESERVE,
RESERVE_TRANSFER_IMPORT_TO_SOURCE, RESERVE_TRANSFER_IDENTITY_EXPORT, RESERVE_TRANSFER_CURRENCY_EXPORT, ...
```

#### Transfer Destination Types (already defined)

```typescript
// All from verus-typescript-primitives/src/pbaas/TransferDestination.ts
DEST_PKH, DEST_ID, DEST_ETH, DEST_FULLID, DEST_REGISTERCURRENCY,
FLAG_DEST_AUX, FLAG_DEST_GATEWAY, ...
```

### What the Library Does NOT Provide

These are bridge-specific and must still be written by us:

| Component | Reason |
|-----------|--------|
| Notarization serialization | Bridge-specific format with gas price field, fork heights, proof roots |
| Cross-chain export building | `serializeCrossChainExport()` — bridge-specific orchestration |
| ETH proof serialization | `serializeEthFullProof()` — Ethereum storage proof format |
| Notarization → Verus JSON transform | Contract ABI tuple → Verus daemon JSON conversion |
| Gas price logic | Fork-height-dependent gas price calculation |
| Provider management | ethers.js WebSocket reconnection, health checks |
| Caching layer | Bridge-specific cache invalidation on events |
| RPC server | HTTP server with auth + queue |
| All CLI tools | Contract upgrade, identity management, financial ops, diagnostics |
| Bridge constants | Fork heights, gas limits, contract addresses, chain system IDs |

### Integration Strategy

```
verus-typescript-primitives (npm dependency)
    ↓ imports
newbridge/src/
    ├── serialization/     ← uses ReserveTransfer, TransferDestination, CurrencyValueMap,
    │                        BufferWriter/Reader, varint from primitives
    ├── bridge/handlers/   ← uses primitives for encoding/decoding API data
    ├── bridge/transfers/  ← uses CurrencyValueMap, ReserveTransfer directly
    ├── bridge/proof/      ← uses MMR, MMRProof, CrossChainProof classes from primitives
    └── utils/             ← re-exports primitives utils + adds bridge-specific helpers
```

**Key principle: Import and extend, don't rewrite.** Where the library's classes need bridge-specific behavior (e.g., ETH proof components with gas price), we extend them or compose with them rather than duplicating.

### Estimated Code Reduction

| Current File | Lines | Replaced By Primitives | Remaining |
|-------------|------:|:----------------------:|----------:|
| `utils.js` | 602 | ~400 (address, binary, math, varint) | ~200 (crypto, hex, bridge-specific) |
| `deserializer.js` | 448 | ~300 (MMR, transfer dest, compact int) | ~150 (bridge-specific proof parsing) |
| `ethInteractor.js` serialization | ~400 | ~300 (reserve transfers, CTD, CCVM) | ~100 (CCE, ETH proof) |
| `notarizationSerializer.js` | ~500 | ~100 (varint, buffer utils) | ~400 (notarization-specific) |
| **Total** | **~1,950** | **~1,100** | **~850** |

---

## 2. New Project Structure

```
newbridge/
├── package.json
├── tsconfig.json
├── .eslintrc.json
├── .prettierrc
├── README.md
│
├── src/
│   ├── index.ts                        # Main entry: exports start/stop/status for programmatic use
│   ├── cli.ts                          # CLI entry: yarn start / interactive menu system
│   │
│   ├── config/
│   │   ├── index.ts                    # Re-exports
│   │   ├── ConfigManager.ts            # Loads/saves veth.conf, validates, provides typed config
│   │   ├── constants.ts                # All chain IDs, flags, fork heights, gas limits
│   │   ├── paths.ts                    # OS-specific path resolution (darwin/linux/win32)
│   │   └── types.ts                    # Config interfaces (IBridgeConfig, IChainConfig, etc.)
│   │
│   ├── server/
│   │   ├── index.ts                    # Re-exports
│   │   ├── RpcServer.ts               # HTTP RPC server class (auth, queue, request handling)
│   │   ├── RpcRouter.ts               # Maps RPC method names → handler functions (replaces apiFunctions.js)
│   │   └── types.ts                    # RPC request/response interfaces
│   │
│   ├── ethereum/
│   │   ├── index.ts                    # Re-exports
│   │   ├── EthereumProvider.ts         # ethers.js provider management, reconnection, health checks
│   │   ├── ContractManager.ts          # Contract instances (delegator), ABI loading, call wrappers
│   │   ├── TransactionSender.ts        # Gas estimation, nonce management, tx submission + receipt
│   │   ├── EventListener.ts           # Block & notarization event subscriptions
│   │   └── types.ts                    # Contract return type interfaces
│   │
│   ├── bridge/
│   │   ├── index.ts                    # Re-exports
│   │   ├── BridgeService.ts           # Orchestrator: wires API handlers, the main bridge logic class
│   │   │
│   │   ├── handlers/                   # One file per RPC API handler (clean single-responsibility)
│   │   │   ├── GetInfoHandler.ts
│   │   │   ├── GetCurrencyHandler.ts
│   │   │   ├── GetExportsHandler.ts
│   │   │   ├── GetBestProofRootHandler.ts
│   │   │   ├── GetNotarizationDataHandler.ts
│   │   │   ├── SubmitImportsHandler.ts
│   │   │   ├── SubmitNotarizationHandler.ts
│   │   │   ├── GetLastImportFromHandler.ts
│   │   │   ├── GetClaimableFeesHandler.ts
│   │   │   ├── RevokeIdentityHandler.ts
│   │   │   └── index.ts               # Handler registry
│   │   │
│   │   ├── proof/
│   │   │   ├── ProofBuilder.ts         # Build storage proofs, ETH proofs
│   │   │   ├── ProofRootValidator.ts   # Validate proof roots against block data
│   │   │   └── types.ts
│   │   │
│   │   └── transfers/
│   │       ├── TransferConditioner.ts  # conditionSubmitImports, address conversion for transfers
│   │       ├── ExportBuilder.ts        # createCrossChainExport, createOutboundTransfers
│   │       └── types.ts               # Transfer-related interfaces
│   │
│   ├── serialization/
│   │   ├── index.ts                    # Re-exports
│   │   ├── NotarizationCodec.ts       # Serialize/deserialize notarization (bridge-specific, NOT in primitives lib)
│   │   ├── NotarizationTransformer.ts  # Convert contract notarization → Verus JSON format
│   │   ├── EthProofSerializer.ts      # ETH storage proof serialization (bridge-specific)
│   │   ├── CrossChainExportCodec.ts   # Serialize/deserialize cross-chain exports (bridge-specific)
│   │   └── types.ts                    # Bridge-specific serialization interfaces (INotarization, ICurrencyState, etc.)
│   │   # NOTE: ReserveTransfer, TransferDestination, CurrencyValueMap, TokenOutput,
│   │   # MMR, CrossChainProof, BufferReader/Writer, varint — all come from
│   │   # verus-typescript-primitives. No need to rewrite these.
│   │
│   ├── cache/
│   │   ├── index.ts                    # Re-exports
│   │   ├── CacheManager.ts            # Generic typed cache with TTL support
│   │   ├── ApiCache.ts                # API-specific cache (getInfo, getCurrency, etc.)
│   │   ├── BlockCache.ts              # Block/import caching
│   │   └── types.ts                    # Cache key enums, TTL config
│   │
│   ├── utils/
│   │   ├── index.ts                    # Re-exports (re-exports primitives utils + bridge-specific)
│   │   ├── crypto.ts                   # Signature splitting/encoding, random credential generation (bridge-specific)
│   │   ├── gas.ts                      # Gas price calculation with fork-height logic (bridge-specific)
│   │   └── hex.ts                      # addHexPrefix, removeHexLeader, reversebytes (thin wrappers if needed)
│   │   # NOTE: address conversion (fromBase58Check, toBase58Check), binary helpers
│   │   # (BufferReader/Writer, varint, varuint), math (bnToDecimal, decimalToBn),
│   │   # and GetMMRProofIndex all come from verus-typescript-primitives.
│   │
│   ├── cli-tools/
│   │   ├── index.ts                    # Interactive CLI menu entry point
│   │   ├── MenuRenderer.ts            # Terminal UI: box-drawing menus, resizable layout
│   │   ├── ToolRunner.ts              # Executes selected tool with progress display
│   │   │
│   │   ├── tools/
│   │   │   ├── UpgradeTool.ts          # Contract upgrade operations
│   │   │   ├── IdentityTool.ts         # Revoke/recover identity (single + multisig)
│   │   │   ├── SendEthTool.ts          # Send ETH from wallet
│   │   │   ├── BurnDaiTool.ts          # Burn DAI DSR fees
│   │   │   ├── ClaimFeesTool.ts        # Claim notary pool fees
│   │   │   ├── DiagnosticsTool.ts      # Check DAI balances, notary balances, convert addresses
│   │   │   └── index.ts               # Tool registry
│   │   │
│   │   └── types.ts                    # CLI tool interfaces
│   │
│   └── types/
│       ├── ethereum.ts                 # Ethereum-specific types (proof objects, block data, etc.)
│       └── common.ts                   # Shared types (Ticker, NetworkConfig, etc.)
│       # NOTE: Verus types (CTransferDestination, CCurrencyValueMap, ReserveTransfer,
│       # TransferDestination, Identity, etc.) are imported from verus-typescript-primitives.
│       # Only bridge-specific types (INotarization, IProofRoot, etc.) live here.
│
├── abi/
│   ├── DaiPot.json
│   └── VerusDelegator.json
│
└── tests/
    ├── setup.ts                        # Test config
    ├── serialization/
    │   ├── serializer.test.ts
    │   ├── deserializer.test.ts
    │   └── notarizationCodec.test.ts
    ├── cache/
    │   └── cacheManager.test.ts
    ├── bridge/
    │   └── handlers/
    │       ├── getInfo.test.ts
    │       └── ...
    └── utils/
        ├── address.test.ts
        └── math.test.ts
```

**File count comparison:**
- Current: **~18 files**, flat or 2-level
- New: **~60+ files**, organized into 10 logical domains

---

## 3. Class & Code Architecture

### Core Classes

```
┌─────────────────────────────────────────────────────────────────┐
│                         BridgeKeeper                            │
│  (top-level orchestrator — instantiated by index.ts or cli.ts)  │
├─────────────────────────────────────────────────────────────────┤
│  + start(config: IBridgeConfig): Promise<void>                  │
│  + stop(): Promise<void>                                        │
│  + status(): Promise<IServerStatus>                             │
│  - rpcServer: RpcServer                                         │
│  - bridgeService: BridgeService                                 │
│  - configManager: ConfigManager                                 │
└──────────────┬──────────────────────────────────────────────────┘
               │ owns
    ┌──────────┴───────────┐
    │                      │
    ▼                      ▼
┌────────────┐    ┌──────────────────┐
│ RpcServer  │    │  BridgeService   │
│            │    │                  │
│ - port     │───▶│ - handlers[]     │
│ - auth     │    │ - ethProvider    │
│ - queue    │    │ - contractMgr    │
│            │    │ - txSender       │
└────────────┘    │ - cache          │
                  │ - eventListener  │
                  └──────┬───────────┘
                         │ owns
         ┌───────────────┼───────────────────┐
         │               │                   │
         ▼               ▼                   ▼
┌─────────────────┐ ┌──────────────┐  ┌──────────────┐
│EthereumProvider │ │ContractManager│  │CacheManager  │
│                 │ │              │  │              │
│ - provider      │ │ - delegator  │  │ - apiCache   │
│ - reconnect()   │ │ - encode()   │  │ - blockCache │
│ - isOnline()    │ │ - decode()   │  │ - get/set()  │
└─────────────────┘ └──────────────┘  │ - ttl logic  │
                                      └──────────────┘
```

### Dependency Injection Pattern

All major classes receive their dependencies via constructor injection. No global mutable state.

```typescript
// Example: BridgeService construction
const config = new ConfigManager(chainName);
const provider = new EthereumProvider(config.ethNodeUrl, config.providerOptions);
const contracts = new ContractManager(provider, config.delegatorAddress);
const cache = new CacheManager({ apiTtl: 60_000, blockTtl: 300_000 });
const txSender = new TransactionSender(provider, config.privateKey);
const eventListener = new EventListener(provider, contracts);

const bridgeService = new BridgeService({
    config,
    provider,
    contracts,
    cache,
    txSender,
    eventListener,
});
```

### Handler Pattern

Each RPC handler is a class implementing a common interface:

```typescript
interface IRpcHandler<TParams = unknown, TResult = unknown> {
    readonly method: string;
    handle(params: TParams): Promise<TResult>;
}

class GetInfoHandler implements IRpcHandler<void, IGetInfoResult> {
    readonly method = 'getinfo';

    constructor(
        private provider: EthereumProvider,
        private contracts: ContractManager,
        private cache: CacheManager,
        private config: ConfigManager,
    ) {}

    async handle(): Promise<IGetInfoResult> {
        const cached = await this.cache.api.get('getinfo');
        if (cached) return cached;

        const [block, chainId] = await Promise.all([
            this.provider.getBlock('latest'),
            this.provider.getNetwork().then(n => n.chainId),
        ]);

        const result: IGetInfoResult = {
            version: constants.VERSION,
            blocks: block.number,
            tiptime: block.timestamp,
            chainid: chainId,
            // ...
        };

        await this.cache.api.set('getinfo', result, 60_000);
        return { result };
    }
}
```

### Type Strategy: Primitives Library + Bridge-Specific Types

Verus data structures are **imported from `verus-typescript-primitives`**, not redefined:

```typescript
// Import canonical types from the primitives library
import {
    ReserveTransfer,
    TransferDestination,
    CurrencyValueMap,
    TokenOutput,
    CrossChainProof,
    Identity,
    MMRProof,
    OptCCParams,
    SignatureData,
    RESERVE_TRANSFER_CROSS_SYSTEM,
    RESERVE_TRANSFER_RESERVE_TO_RESERVE,
    DEST_PKH,
    DEST_ID,
    DEST_ETH,
    FLAG_DEST_AUX,
    FLAG_DEST_GATEWAY,
} from 'verus-typescript-primitives';

import {
    fromBase58Check,
    toBase58Check,
} from 'verus-typescript-primitives/utils/address';

import bufferutils from 'verus-typescript-primitives/utils/bufferutils';
const { BufferReader, BufferWriter } = bufferutils;
```

**Bridge-specific types** (not in primitives) are defined locally:

```typescript
// src/types/ethereum.ts — bridge-specific
interface IEthProofRoot {
    version: number;
    type: number;
    systemId: string;
    height: number;
    stateRoot: string;
    blockHash: string;
    compactPower: string;
    gasPrice: bigint;         // bridge-specific field
}

// src/serialization/types.ts — bridge-specific notarization
interface INotarization {
    version: number;
    flags: number;
    proposer: TransferDestination;  // ← uses primitives class
    currencyId: string;
    currencyState: ICurrencyState;
    notarizationHeight: number;
    prevHeight: number;
    hashPrevCrossNotarization: string;
    prevNotarizationTxid: string;
    prevNotarizationOut: number;
    nodes: INetworkNode[];
    proofRoots: Record<string, IEthProofRoot>;
}

interface ICurrencyState {
    flags: number;
    version: number;
    currencyId: string;
    currencies: string[];                     // i-addresses
    weights: BigNumber[];                      // ← uses BN from bn.js (same as primitives)
    reserves: BigNumber[];
    initialsupply: BigNumber;
    emitted: BigNumber;
    supply: BigNumber;
    // ... per-currency detail arrays
}
```

---

## 4. Program Launch

### Two Entry Points

#### 1. CLI — `yarn start`

```
package.json:
  "scripts": {
    "start": "ts-node src/cli.ts",
    "build": "tsc",
    "start:prod": "node dist/cli.js",
    "tools": "ts-node src/cli-tools/index.ts",
    "test": "vitest"
  }
```

```typescript
// src/cli.ts
import { Command } from 'commander';
import { BridgeKeeper } from './index';

const program = new Command();

program
    .name('bridgekeeper')
    .description('Verus-Ethereum Bridge Keeper')
    .option('-t, --testnet', 'Use VRSCTEST network')
    .option('-d, --debug', 'Enable debug logging')
    .option('--debug-submit', 'Debug import submissions')
    .option('--debug-notarization', 'Debug notarizations')
    .option('--no-imports', 'Disable import processing')
    .option('--check-hash', 'Enable hash checking')
    .option('--console-log', 'Enable timestamped console logging');

program.command('start')
    .description('Start the bridge keeper server')
    .action(async (opts) => {
        const bridge = new BridgeKeeper();
        await bridge.start({
            ticker: opts.testnet ? 'VRSCTEST' : 'VRSC',
            debug: opts.debug,
            // ...
        });
    });

program.command('tools')
    .description('Open interactive tools menu')
    .action(async () => {
        // Launch interactive CLI menu
        const { CliMenu } = await import('./cli-tools/index');
        await new CliMenu().run();
    });

program.parse();
```

#### 2. Programmatic — import as library

```typescript
// src/index.ts
export class BridgeKeeper {
    private rpcServer: RpcServer;
    private bridgeService: BridgeService;
    private configManager: ConfigManager;

    async start(config: IBridgeConfig): Promise<boolean> { /* ... */ }
    async stop(): Promise<boolean> { /* ... */ }
    async status(): Promise<IServerStatus> { /* ... */ }
}

// Usage from another program:
import { BridgeKeeper } from 'verus-bridgekeeper';
const bridge = new BridgeKeeper();
await bridge.start({ ticker: 'VRSC' });
```

---

## 5. Interactive CLI Tools Menu

Replace all `utilities/*.js` scripts with an interactive terminal UI using [Ink](https://github.com/vadimdemedes/ink) (React for CLI) or [inquirer](https://github.com/SBoudrias/Inquirer.js) + [boxen](https://github.com/sindresorhus/boxen) + [chalk](https://github.com/chalk/chalk).

### Menu Structure

```
╔══════════════════════════════════════════════════════════╗
║              🏰 Verus Bridge Keeper Tools                ║
║                     VRSC (mainnet)                       ║
╠══════════════════════════════════════════════════════════╣
║                                                          ║
║   [1]  🔄 Contract Upgrade                               ║
║   [2]  🔑 Identity Management                            ║ 
║        ├── Revoke Identity                               ║
║        ├── Recover Identity                              ║
║        ├── Create Multisig Revoke Packet                 ║
║        ├── Create Multisig Recover Packet                ║
║        ├── Submit Multisig Revoke                        ║
║        └── Submit Multisig Recover                       ║
║   [3]  💰 Financial Operations                           ║
║        ├── Send ETH                                      ║
║        ├── Burn DAI Fees                                 ║
║        └── Claim Pool Fees                               ║
║   [4]  🔍 Diagnostics                                    ║
║        ├── Check DAI Balances                            ║
║        ├── Notary Fee Pool Balance                       ║
║        ├── Convert Address (Base58 ↔ Hex)                ║
║        ├── Get Contract Hash                             ║
║        └── Count Upgrade Votes                           ║
║   [5]  ⚙️  Configuration                                 ║
║        ├── View Current Config                           ║
║        └── Edit Config                                   ║
║                                                          ║
║   [q]  Exit                                              ║
║                                                          ║
╚══════════════════════════════════════════════════════════╝
```

Each tool presents a step-by-step wizard:
- Shows current values / descriptions
- Prompts for inputs with validation
- Shows a dry-run summary before execution
- Confirms before sending transactions
- Displays results with formatted output

### Implementation

```typescript
// src/cli-tools/MenuRenderer.ts
import inquirer from 'inquirer';
import chalk from 'chalk';
import boxen from 'boxen';

export class MenuRenderer {
    async showMainMenu(): Promise<string> {
        console.clear();
        console.log(boxen(
            chalk.bold('Verus Bridge Keeper Tools\n') + chalk.dim(`${this.ticker} network`),
            { padding: 1, borderStyle: 'double', borderColor: 'blue' }
        ));

        const { choice } = await inquirer.prompt([{
            type: 'list',
            name: 'choice',
            message: 'Select a category:',
            choices: [
                { name: '🔄 Contract Upgrade', value: 'upgrade' },
                { name: '🔑 Identity Management', value: 'identity' },
                { name: '💰 Financial Operations', value: 'financial' },
                { name: '🔍 Diagnostics', value: 'diagnostics' },
                { name: '⚙️  Configuration', value: 'config' },
                new inquirer.Separator(),
                { name: chalk.red('Exit'), value: 'exit' },
            ],
        }]);

        return choice;
    }
}
```

---

## 6. Cache Strategy

Replace `react-native-cache` with a purpose-built typed caching layer.

### Design

```typescript
// src/cache/CacheManager.ts
interface CacheEntry<T> {
    value: T;
    expiresAt: number;     // Date.now() + TTL
    blockHeight?: number;  // invalidate on new block
}

class CacheManager {
    private stores: Map<string, Map<string, CacheEntry<unknown>>>;

    constructor(private config: ICacheConfig) {
        this.stores = new Map();
    }

    // Typed sub-caches
    get api(): TypedCache<ApiCacheKeys> { /* ... */ }
    get block(): TypedCache<BlockCacheKeys> { /* ... */ }
    get import(): TypedCache<ImportCacheKeys> { /* ... */ }

    // Invalidation hooks
    onNewNotarization(): void {
        this.api.clear();           // All API cache invalidated
    }

    onNewBlock(height: number): void {
        this.api.invalidateByKey('getinfo');
        this.block.set('latestHeight', height);
    }
}
```

### Cache TTL Strategy

| Cache Key | TTL | Invalidation Trigger |
|-----------|-----|---------------------|
| `getinfo` | 60s | New block event |
| `getcurrency` | 300s | New notarization event |
| `getnotarizationdata` | 0 (manual) | New notarization event |
| `getbestproofroot` | 60s | New block event |
| `getlastimportfrom` | 60s | New notarization event |
| `block:{height}` | ∞ (immutable) | Never (blocks are immutable) |
| `import:{hash}` | 300s | New notarization event |

---

## 7. Migration: Web3.js → ethers.js

### Key Mapping

| Web3.js | ethers.js |
|---------|-----------|
| `new Web3(provider)` | `new ethers.providers.WebSocketProvider(url)` |
| `web3.eth.Contract(abi, addr)` | `new ethers.Contract(addr, abi, provider)` |
| `web3.eth.accounts.wallet.add(key)` | `new ethers.Wallet(key, provider)` |
| `web3.eth.getBlock('latest')` | `provider.getBlock('latest')` |
| `web3.eth.getProof(addr, keys, block)` | `provider.send('eth_getProof', [...])` |
| `web3.eth.subscribe('logs', opts)` | `contract.on('event', callback)` |
| `web3.eth.subscribe('newBlockHeaders')` | `provider.on('block', callback)` |
| `web3.utils.fromWei(val, 'gwei')` | `ethers.utils.formatUnits(val, 'gwei')` |
| `web3.eth.abi.decodeParameters(types, data)` | `ethers.utils.defaultAbiCoder.decode(types, data)` |
| `contract.methods.fn().call()` | `contract.fn()` (read) |
| `contract.methods.fn().send({from})` | `contract.fn({ gasLimit })` (with signer) |

### Provider Reconnection

ethers.js v6 has built-in reconnection for WebSocket providers. For v5 (currently used via ethers 5.1.0), we build a wrapper:

```typescript
// src/ethereum/EthereumProvider.ts
class EthereumProvider {
    private provider: ethers.providers.WebSocketProvider;
    private reconnecting = false;

    async connect(): Promise<void> { /* ... */ }

    async reconnect(): Promise<void> {
        if (this.reconnecting) return;
        this.reconnecting = true;
        // close old, create new, re-subscribe events
        this.reconnecting = false;
    }

    async getBlock(tag: string | number): Promise<ethers.providers.Block> {
        await this.ensureConnected();
        return this.provider.getBlock(tag);
    }
}
```

---

## 8. Technology Stack

| Concern | Library | Reason |
|---------|---------|--------|
| Language | TypeScript 5.x | Type safety for complex blockchain data |
| **Verus Primitives** | **verus-typescript-primitives** | **Canonical typed classes for ReserveTransfer, TransferDestination, CurrencyValueMap, MMR, Identity, BufferReader/Writer, varint, address utils — eliminates ~1,100 lines of hand-rolled serialization** |
| Ethereum | ethers.js 6.x | Modern, typed, smaller bundle, better docs |
| HTTP Server | Node.js `http` (native) | Lightweight, no framework needed for simple RPC |
| CLI Menu | inquirer + chalk + boxen | Mature, popular, supports complex prompts |
| CLI Args | commander | Standard CLI argument parsing |
| Config | ini (keep existing) | Compatibility with existing veth.conf files |
| Cache | Custom in-memory (Map) | Simple, typed, no external dependency needed |
| Crypto | Provided by verus-typescript-primitives (blake2b, create-hash) | Primitives lib bundles blake2b + create-hash; bitgo-utxo-lib no longer needed for address ops |
| Testing | vitest | Fast, TypeScript-native, compatible with Jest API |
| Linting | ESLint + @typescript-eslint | Standard TS linting |
| Build | tsc + tsup | Type checking + bundling for production |

---

## 9. Implementation Phases

### Phase 1 — Foundation (scaffold, config, types)
- [ ] Initialize TypeScript project (`tsconfig.json`, `package.json`, eslint)
- [ ] **Add `verus-typescript-primitives` as npm dependency**
- [ ] Create folder structure (empty files with interfaces)
- [ ] Port `constants.ts` — bridge-specific constants only (fork heights, gas limits, chain IDs); use primitives lib for address versions, VDXF keys, etc.
- [ ] Port `types/` — bridge-specific interfaces only (`INotarization`, `IEthProofRoot`, `ICurrencyState`); import `TransferDestination`, `CurrencyValueMap`, `ReserveTransfer`, etc. from primitives
- [ ] Port `config/` (`ConfigManager`, `paths`)
- [ ] Port `utils/` — **only bridge-specific utils** (`crypto.ts` for signature splitting, `gas.ts` for fork-height gas logic, `hex.ts` thin wrappers); address conversion, binary helpers, math, and MMR index all come from primitives
- [ ] Write tests for bridge-specific utils; primitives lib has its own tests

### Phase 2 — Ethereum Layer
- [ ] Implement `EthereumProvider` (ethers.js connection, reconnection)
- [ ] Implement `ContractManager` (delegator contract, ABI calls)
- [ ] Implement `TransactionSender` (gas, nonce, send + receipt)
- [ ] Implement `EventListener` (block + notarization subscriptions)
- [ ] Write tests with mocked provider

### Phase 3 — Serialization (bridge-specific only)
- [ ] Port `NotarizationCodec` — bridge-specific notarization format (uses `BufferWriter`/`BufferReader` from primitives)
- [ ] Port `NotarizationTransformer` (contract format → Verus JSON)
- [ ] Port `EthProofSerializer` — ETH storage proof serialization (bridge-specific)
- [ ] Port `CrossChainExportCodec` — cross-chain export building (bridge-specific)
- [ ] **Verify** that `ReserveTransfer.toBuffer()` / `fromBuffer()` from primitives produces identical output to current `serializeCReserveTransfers()` — write comparison tests with real data
- [ ] **Verify** that `TransferDestination.toBuffer()` / `fromBuffer()` matches current `serializeCTransferDestination()`
- [ ] **Verify** that `CurrencyValueMap.toBuffer()` matches current `serializeCCurrencyValueMapArray()`
- [ ] Write tests using existing test data from notarizationSerializer.js

### Phase 4 — Cache
- [ ] Implement `CacheManager` with TTL and typed keys
- [ ] Implement `ApiCache`, `BlockCache` sub-caches
- [ ] Wire invalidation to event listener
- [ ] Write cache tests

### Phase 5 — Bridge Handlers
- [ ] Implement `BridgeService` orchestrator
- [ ] Port each handler one-by-one (12 handlers)
- [ ] Implement proof building (`ProofBuilder`, `ProofRootValidator`)
- [ ] Implement transfer conditioning (`TransferConditioner`, `ExportBuilder`)
- [ ] Write handler tests

### Phase 6 — Server & Entry Points
- [ ] Implement `RpcServer` (HTTP, auth, queue)
- [ ] Implement `RpcRouter`
- [ ] Implement `BridgeKeeper` top-level class
- [ ] Implement `cli.ts` (commander-based CLI)
- [ ] Implement `index.ts` (programmatic export)
- [ ] Integration test: start → handle request → stop

### Phase 7 — CLI Tools
- [ ] Implement `MenuRenderer` (interactive terminal UI)
- [ ] Port `UpgradeTool`
- [ ] Port `IdentityTool` (revoke, recover, multisig)
- [ ] Port `SendEthTool`
- [ ] Port `BurnDaiTool`
- [ ] Port `ClaimFeesTool`
- [ ] Port `DiagnosticsTool` (DAI check, notary balance, address convert, contract hash, vote count)
- [ ] End-to-end CLI testing

### Phase 8 — Polish
- [ ] Comprehensive error handling and logging
- [ ] README with usage documentation
- [ ] CI configuration
- [ ] Config migration guide (old veth.conf → new format)
- [ ] Performance benchmarks (cache hit rates, request latency)

---

## 10. Key Design Decisions

| Decision | Choice | Rationale |
|----------|--------|-----------|
| **Use verus-typescript-primitives** | **Yes, as npm dependency** | **Provides canonical, tested TypeScript classes for ~15 core Verus data structures + serialization + address utils + MMR. Eliminates ~1,100 lines of hand-rolled Buffer code in utils.js, deserializer.js, and ethInteractor.js. Maintained by the Verus team.** |
| ethers.js version | v6.x | Latest stable, native BigInt, better WebSocket handling |
| No Express/Fastify | Native `http` | Only need basic POST handling with auth; keep deps minimal |
| DI without framework | Constructor injection | Simple, explicit, no magic — project isn't large enough for IoC container |
| Drop `bitgo-utxo-lib` | Yes | `verus-typescript-primitives` provides `fromBase58Check`/`toBase58Check` — no longer need bitgo-utxo-lib for address encoding |
| Monorepo or single package | Single package | Project scope doesn't warrant monorepo complexity |
| Class-based handlers | Yes | Each handler has its own state (cache keys, timeouts); better than bare functions |
| Config file format | Keep `.conf` (ini) | Backward compatibility with existing deployed nodes |
| Interactive CLI lib | inquirer | Battle-tested, supports all needed prompt types, works on all platforms |

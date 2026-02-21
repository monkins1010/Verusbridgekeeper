# Verus Bridge Keeper v2

Bridges Verus and Ethereum blockchains — monitors cross-chain transfers, submits notarizations, and processes imports.

## Prerequisites

- **Node.js** >= 18
- **Verus daemon** running (`verusd` or `vrsctest`) with RPC enabled
- **Ethereum node** WebSocket endpoint (e.g. Infura, Alchemy, self-hosted)
- A funded Ethereum wallet (private key)

## Setup

```bash
npm install
```

### Configuration

Create a `veth.conf` file in the project root (or the default OS path). Example:

```ini
rpcuser=verususer
rpcpassword=veruspassword
rpcport=27486
rpchost=127.0.0.1
rpcallowip=127.0.0.1
ethnode=wss://mainnet.infura.io/ws/v3/YOUR_KEY
delegatorcontractaddress=0xYOUR_DELEGATOR_CONTRACT
privatekey=YOUR_ETH_PRIVATE_KEY
```

The keeper also reads the Verus daemon's own config (for `signmessage` RPC access) from its default location.

## Running

### Start the Bridge Keeper

```bash
# Mainnet (VRSC)
npm start

# Testnet (VRSCTEST)
npm start -- --testnet

# With debug logging
npm start -- --debug
```

### Open the CLI Tools Menu

```bash
# Mainnet
npm run tools

# Testnet
npm run tools -- --testnet
```

This opens an interactive menu with all available utilities:

| Tool | Category | What it does |
|---|---|---|
| **Burn DAI Fees** | Bridge Ops | Burns accumulated DAI DSR interest fees back to Bridge.vETH |
| **Claim Pool Fees** | Bridge Ops | Claims ETH from the notary fee pool |
| **Send ETH** | Wallet Ops | Sends ETH from the bridge wallet to any address |
| **Contract Upgrade** | Admin | Hash, submit, and vote-count for contract upgrades |
| **Identity Management** | Identity | Revoke/recover notary IDs (single signer + multisig) |
| **Diagnostics** | Diagnostics | Wallet balance, fee pools, DAI/DSR health, contract list, address conversion |

Each tool displays built-in help text when selected — no need to look anything up externally.

### Production (compiled)

```bash
npm run build
npm run start:prod
```

## CLI Reference

```
bridgekeeper [options] <command>

Options:
  -t, --testnet              Use VRSCTEST network
  -d, --debug                Enable debug logging
  --debug-submit             Debug import submissions
  --debug-notarization       Debug notarizations
  --no-imports               Disable import processing
  --check-hash               Enable hash checking
  --console-log              Timestamped console logging

Commands:
  start                      Start the bridge keeper server
  tools                      Open interactive tools menu
  status                     Check bridge keeper status
```

## Development

```bash
# Type-check
npx tsc --noEmit

# Run tests
npm test

# Watch mode
npm run test:watch

# Lint
npm run lint
npm run lint:fix
```

## Project Structure

```
src/
  cli.ts                     CLI entry point (commander)
  index.ts                   BridgeKeeper main class
  bridge/                    Bridge service + RPC handlers
  cache/                     Caching layer
  cli-tools/                 Interactive tools menu
    tools/                   Individual tool implementations
  config/                    Config loading (veth.conf, chain constants)
  ethereum/                  Provider, contracts, event listener, tx sender
  serialization/             Cross-chain data codecs
  server/                    JSON-RPC server
  types/                     Shared type definitions
  utils/                     Hex, crypto, gas helpers
```

## License

MIT

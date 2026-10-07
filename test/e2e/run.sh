#!/bin/bash
# Runs the end to end suite against a fresh Ganache with the Verus-Ethereum contracts deployed.
#
#   npm run test:e2e
#
# Needs the sibling Verus-Ethereum-contracts checkout (override with E2E_CONTRACTS_DIR) with its
# node_modules installed and truffle on the PATH. Uses port 8545 (the truffle development network).
set -euo pipefail

HERE="$(cd "$(dirname "$0")" && pwd)"
KEEPER_DIR="$(cd "$HERE/../.." && pwd)"
CONTRACTS_DIR="$(cd "${E2E_CONTRACTS_DIR:-$KEEPER_DIR/../Verus-Ethereum-contracts}" && pwd)"
LOG_DIR="$(mktemp -d)"

if (echo > /dev/tcp/127.0.0.1/8545) 2>/dev/null; then
    echo "Port 8545 is already in use: stop the running node first (the suite needs a fresh chain)." >&2
    exit 1
fi

cd "$CONTRACTS_DIR"
node_modules/.bin/ganache-cli -d -l 1500000000 -p 8545 > "$LOG_DIR/ganache.log" 2>&1 &
GANACHE_PID=$!
trap 'kill $GANACHE_PID 2>/dev/null || true' EXIT

for _ in $(seq 1 30); do
    (echo > /dev/tcp/127.0.0.1/8545) 2>/dev/null && break
    sleep 1
done

echo "Deploying contracts (log: $LOG_DIR/migrate.log)"
truffle migrate --f 1 --to 2 --network development > "$LOG_DIR/migrate.log" 2>&1 \
    || { tail -30 "$LOG_DIR/migrate.log"; exit 1; }
DELEGATOR="$(grep -o 'delegatorcontractaddress=0x[0-9a-fA-F]\{40\}' "$LOG_DIR/migrate.log" | tail -1 | cut -d= -f2)"
[ -n "$DELEGATOR" ] || { echo "Could not find the Delegator address in the migration output" >&2; exit 1; }
echo "Delegator: $DELEGATOR"

cd "$KEEPER_DIR"
E2E_DELEGATOR="$DELEGATOR" E2E_ETHNODE="ws://127.0.0.1:8545" E2E_CONTRACTS_DIR="$CONTRACTS_DIR" \
    node --test --test-reporter=spec "$HERE"/*.e2e.test.js

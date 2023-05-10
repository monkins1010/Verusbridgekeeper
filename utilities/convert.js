const base58check = require('base58check');
const key = process.argv[2]
const decoded = base58check.decode(key, 'hex')
console.log("\nETH key:\n\n0x" + decoded.data + "\n")
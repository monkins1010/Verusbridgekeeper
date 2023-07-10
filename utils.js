const BigNumber = require('bignumber.js');
const bitGoUTXO = require('bitgo-utxo-lib');
const Long = require('long');
var constants = require('./constants');
const Web3 = require('web3');
const abi = new Web3().eth.abi

class BigDecimal {
    // Configuration: constants
    static DECIMALS = 18; // number of decimals on all instances
    static ROUNDED = true; // numbers are truncated (false) or rounded (true)
    static SHIFT = BigInt("1" + "0".repeat(BigDecimal.DECIMALS)); // derived constant
    constructor(value) {
        if (value instanceof BigDecimal) return value;
        let [ints, decis] = String(value).split(".").concat("");
        this._n = BigInt(ints + decis.padEnd(BigDecimal.DECIMALS, "0")
                                     .slice(0, BigDecimal.DECIMALS)) 
                  + BigInt(BigDecimal.ROUNDED && decis[BigDecimal.DECIMALS] >= "5");
    }
    static fromBigInt(bigint) {
        return Object.assign(Object.create(BigDecimal.prototype), { _n: bigint });
    }
    add(num) {
        return BigDecimal.fromBigInt(this._n + new BigDecimal(num)._n);
    }
    subtract(num) {
        return BigDecimal.fromBigInt(this._n - new BigDecimal(num)._n);
    }
    static _divRound(dividend, divisor) {
        return BigDecimal.fromBigInt(dividend / divisor 
            + (BigDecimal.ROUNDED ? dividend  * 2n / divisor % 2n : 0n));
    }
    multiply(num) {
        return BigDecimal._divRound(this._n * new BigDecimal(num)._n, BigDecimal.SHIFT);
    }
    divide(num) {
        return BigDecimal._divRound(this._n * BigDecimal.SHIFT, new BigDecimal(num)._n);
    }
    toString() {
        const s = this._n.toString().padStart(BigDecimal.DECIMALS+1, "0");
        return s.slice(0, -BigDecimal.DECIMALS) + "." + s.slice(-BigDecimal.DECIMALS)
                .replace(/\.?0+$/, "");
    }
}


const addHexPrefix = (string) => {
    if (string.startsWith("0x")) return string;
    else return "0x" + string;
};

const uint64ToVerusFloat = (number) => {
   
    var input = BigInt(number);
    var inter = (input / BigInt(100000000)) + '.';
    var decimalp = "" + (input % BigInt(100000000));

    if(input < 0)
    {
        inter = "-" + inter;
        decimalp = decimalp.slice(1);
    }

    while (decimalp.length < 8) {
        decimalp = "0" + decimalp;
    }
    return (inter + decimalp)
}

const weitoEther = (number) => {
    var inter = (BigInt(number) / BigInt(1000000000000000000)) + '.';
    var decimalp = "" + (BigInt(number) % BigInt(1000000000000000000));

    while (decimalp.length < 18) {
        decimalp = "0" + decimalp;
    }
    return (inter + decimalp)
}

const convertVerusAddressToEthAddress = (verusAddress) => {
    return "0x" + bitGoUTXO.address.fromBase58Check(verusAddress).hash.toString('hex');
}

const serializeCCurrencyValueMapArray = (ccvm) => {
    let encodedOutput = writeCompactSize(ccvm.length);

    for (let i = 0; i < ccvm.length; i++) {

        encodedOutput = Buffer.concat([encodedOutput, bitGoUTXO.address.fromBase58Check(ccvm[i].currency, 160).hash]);
        encodedOutput = Buffer.concat([encodedOutput, writeUInt((ccvm[i].amount), 64)]);

    }
    return encodedOutput
}

const serializeReserveCurrenciesArray = (ccvm) => {

    let encodedOutput = writeCompactSize(ccvm.length);

    for (const item of ccvm) {

        encodedOutput = Buffer.concat([encodedOutput, bitGoUTXO.address.fromBase58Check(item.currencyid, 160).hash]);

    }
    return encodedOutput
}

const serializeReserveWeightsArray = (ccvm, size) => {

    let encodedOutput = writeCompactSize(ccvm.length);

    for (const items of ccvm) {
        
        encodedOutput = Buffer.concat([encodedOutput, writeUInt(convertToInt64(items.weight), 32)]); 
    }

    return encodedOutput

}

const serializeReservesArray = (ccvm) => {

    let encodedOutput = writeCompactSize(ccvm.length);

    for (const items of ccvm) {
        
        encodedOutput = Buffer.concat([encodedOutput, writeUInt(convertToInt64(items.reserves), 64)]); 
    }

    return encodedOutput
}

const serializeIntArray = (ccvm, object, size) => {

    if (!ccvm)
    {
        return Buffer.alloc(1);
    }
    let keys = Object.keys(ccvm)

    let encodedOutput = writeCompactSize(keys.length);

    for (const items of keys) {
        
        encodedOutput = Buffer.concat([encodedOutput, writeUInt(convertToInt64(ccvm[items][object]), size)]); 
    }

    return encodedOutput
}

const splitSignature = (fullSig) => {

    let vArray = Uint8Array.from(Buffer.from(fullSig.substr(0, 2), 'hex'));
    let vVal = vArray[0];
    let rVal = addHexPrefix(fullSig.substr(2, 64));
    let sVal = addHexPrefix(fullSig.substr(66, 64));
    //need to keep v as a uint8 because otherwise web3 doesnt like it  
    return { vVal, rVal, sVal };
}

const splitSignatures = (fullSigs) => {
    let vs = [];
    let rs = [];
    let ss = [];
    for (let i = 0; i < fullSigs.length; i++) {
        let splitSig = splitSignature(fullSigs[i]);
        vs.push(splitSig.vVal);
        rs.push(splitSig.rVal);
        ss.push(splitSig.sVal);
    }
    return { vsVals: vs, rsVals: rs, ssVals: ss };
}

const convertToRAddress = (RAddress) => {
    return "0x" + bitGoUTXO.address.fromBase58Check(RAddress).hash.toString('hex');
}

const convertToUint256 = (inputNumber) => {
    return new BigNumber(inputNumber * 10e+18);
}

const convertToInt64 = (inputNumber) => {
    let bigNum = BigNumber(inputNumber).multipliedBy(100000000);
    return bigNum.toFixed(0);
}

const addBytesIndicator = (input) => {
    return '0x' + input;
}

const convertToCurrencyValues = (input) => {
    let keys = Object.keys(input);
    let values = Object.values(input);
    let ccurrency = [];
    for (let i = 0; i < input.length; i++) {
        ccurrency.push({ currency: keys[i], amount: values[i] });
    }
    return ccurrency;
}

const increaseHexByAmount = (hex, amount) => {
    let x = new BigNumber(hex);
    let sum = x.plus(amount);
    let result = '0x' + sum.toString(16);
    return result;
}

const writeVarInt = (newNumber) => {
    //   console.log(newNumber);
    if (!newNumber) return Buffer.from('00', 'hex');

    let tmp = [];
    let len = 0;
    // eslint-disable-next-line no-constant-condition
    while (true) {
        tmp[len] = (newNumber & 0x7f) | (len ? 0x80 : 0x00);
        if (newNumber <= 0x7f) break;
        for (let i = 0; i < 7; i++)
            newNumber = Math.floor(newNumber / 2); //java cant to bit shifts
        newNumber = newNumber - 1;
        len++;
    }
    //reverse the array return it as a buffer
    tmp = tmp.reverse();
    return Buffer.from(tmp);
}

const readVarInt = (data) => {
    let n = BigInt(0);
    let is = Buffer.from(data, 'hex');
    let pos = 0;
    // eslint-disable-next-line no-constant-condition
    while (true) {
        let chData = is.readUInt8(pos); //single char
        pos++;
        n = (n * BigInt(128)) | BigInt(chData & 0x7F);
        if (chData & 0x80)
            n++;
        else
            return n;
    }
}

const writeCompactSize = (newNumber) => {
    let outBuffer = Buffer.alloc(1);
    if (newNumber < 253) {
        outBuffer.writeUInt8(newNumber);
    } else if (newNumber <= 0xFFFF) {
        outBuffer.writeUInt8(253);
        let secondBuffer = Buffer.alloc(2);
        secondBuffer.writeUInt16LE(newNumber);
        outBuffer = Buffer.concat([outBuffer, secondBuffer]);
    } else if (newNumber <= 0xFFFFFFFF) {
        outBuffer.writeUInt8(254);
        let secondBuffer = Buffer.alloc(4);
        secondBuffer.writeUInt32LE(newNumber);
        outBuffer = Buffer.concat([outBuffer, secondBuffer]);
    } else {
        outBuffer.writeUInt8(255);
        let secondBuffer = Buffer.alloc(8);
        secondBuffer.writeUInt32LE(newNumber);
        outBuffer = Buffer.concat([outBuffer, secondBuffer]);
    }
    return outBuffer;
}

const removeHexLeader = (hexString) => {
    if (hexString.substr(0, 2) == '0x') return hexString.substr(2);
    else return hexString;
}

const uint160ToVAddress = (number, version) => {

    if(number.slice(0,2) != '0x' && (number.length != 40)) //if bigint passed instead of hex
    {
        let temphex = Web3.utils.toHex(number);
        return (bitGoUTXO.address.toBase58Check(Buffer.from(removeHexLeader(temphex), 'hex'), version));
    }
    return (bitGoUTXO.address.toBase58Check(Buffer.from(removeHexLeader(number), 'hex'), version));
}

const hexAddressToBase58 = (type, address) => {

    let retval = {};
    if ((parseInt(type & constants.R_ADDRESS_TYPE)) == constants.R_ADDRESS_TYPE) 
    {
        retval = uint160ToVAddress(address, constants.RADDRESS);
    } 
    else if ((parseInt(type & constants.I_ADDRESS_TYPE)) == constants.I_ADDRESS_TYPE) 
    {
        retval = uint160ToVAddress(address, constants.IADDRESS);
    }
    else if  ((parseInt(type & constants.ETH_ADDRESS_TYPE)) == constants.ETH_ADDRESS_TYPE) {
        retval = address;
    }
    return retval;

}

const writeUInt160LE = (uint160le) => {
    let output = Buffer.alloc(20);
    output.write(String(uint160le));
    return output;
}

const writeUInt256LE = (uint256le) => {
    let output = Buffer.alloc(32);
    output.write(removeHexLeader(uint256le), 'hex');
    return output;
}


const writeUInt = (uint, uintType) => {
    let outBuffer = null;
    switch (uintType) {
        case 16:
            outBuffer = Buffer.alloc(2);
            outBuffer.writeUInt16LE(uint);
            //writeUInt16LE(uint);
            break;
        case 32:
            outBuffer = Buffer.alloc(4);
            outBuffer.writeUInt32LE(uint);
            break;
        case 64:
            outBuffer = Buffer.alloc(8);
            outBuffer.writeBigInt64LE(BigInt(uint));
            break;
        case 160:
            outBuffer =
                writeUInt160LE(uint);
            break;
        case 256:
            outBuffer =
                writeUInt256LE(uint);
            break;
        default:
            outBuffer = Buffer.alloc(1);
            outBuffer.writeUInt8(uint);
    }
    return outBuffer;
}

const GetMMRProofIndex = (pos, mmvSize, extraHashes) => {
    let index = new Long(0x00, 0x00);
    let layerSizes = [];
    let merkleSizes = [];
    let peakIndexes = [];
    let bitPos = 0;

    //start at the beginning
    //create a simulation of a mmr based on size
    if (!(pos > 0 && pos < mmvSize)) return 0;

    //create an array of all the sizes
    while (mmvSize) {
        layerSizes.push(mmvSize);
        mmvSize = mmvSize >> 1
    }

    for (let height = 0; height < layerSizes.length; height++) {
        if (height == layerSizes.length - 1 || layerSizes[height] & 1) {
            peakIndexes.push(height);
        }
    }

    //array flip peak indexes
    peakIndexes.reverse();

    let layerNum = 0;
    let layerSize = peakIndexes.length;

    for (let passThrough = (layerSize & 1); layerNum == 0 || layerSize > 1; passThrough = (layerSize & 1), layerNum++) {
        layerSize = (layerSize >> 1) + passThrough;
        if (layerSize) {
            merkleSizes.push(layerSize);
        }
    }
    //flip the merklesizes

    for (let i = 0; i < extraHashes; i++) {
        bitPos++;
    }

    let p = pos;
    for (let l = 0; l < layerSizes.length; l++) {
        if (p & 1) {
            index = index.or(new Long(1, 0, true).shl(bitPos++));

            p >>= 1;

            for (let i = 0; i < extraHashes; i++) {
                bitPos++;
            }

        } else {
            if (layerSizes[l] > (p + 1)) {

                bitPos++;
                p >>= 1;
                for (let i = 0; i < extraHashes; i++) {
                    bitPos++;
                }
            } else {

                for (p = 0; p < peakIndexes.length; p++) {

                    if (peakIndexes[p] == l) {
                        break;
                    }
                }

                for (let layerNum = -1, layerSize = peakIndexes.length; layerNum == -1 || layerSize > 1; layerSize = merkleSizes[++layerNum]) {

                    if (p < (layerSize - 1) || (p & 1)) {


                        if (p & 1) {
                            // hash with the one before us
                            index = index.or(new Long(1, 0, true).shl(bitPos++));

                            for (let i = 0; i < extraHashes; i++) {
                                bitPos++;
                            }
                        } else {
                            // hash with the one in front of us
                            bitPos++;

                            for (let i = 0; i < extraHashes; i++) {
                                bitPos++;
                            }
                        }
                    }
                    p >>= 1;
                }

                break;
            }

        }
    }
    return index.toNumber();
}

const encodeSignatures = (signatures) => {
    let sigKeys = Object.keys(signatures);
    let splitSigs = {}
    let vsVals = [];
    let rsVals = [];
    let ssVals = [];
    let blockheights = [];
    let notaryAddresses = [];

    for (let i = 0; i < sigKeys.length; i++) {

        splitSigs = splitSignature(signatures[sigKeys[i]].signatures[0]);
        vsVals.push(splitSigs.vVal);
        rsVals.push(splitSigs.rVal);
        ssVals.push(splitSigs.sVal);
        blockheights.push(signatures[sigKeys[i]].blockheight);
        notaryAddresses.push(convertVerusAddressToEthAddress(sigKeys[i]));
    }

    let data = abi.encodeParameter({
        "data": {
            "_vs": 'uint8[]',
            "_rs": 'bytes32[]',
            "_ss": 'bytes32[]',
            "blockheights": "uint32[]",
            "notaryAddress": "address[]"
        }
    }, {
        "_vs": vsVals,
        "_rs": rsVals,
        "_ss": ssVals,
        "blockheights": blockheights,
        "notaryAddress": notaryAddresses
    });

    //remove first 32bytes + 0x from hex array, so abi.decode in contract recievces correct value.
    data = "0x" + data.slice(66); 

    return data;

}

const randomPassAndUser = () => {

        var passLength = 64;
        var userLength = 15;
        const charset = 
        "@#$&*0123456789ABCDEFGHIJKLMNOPQRSTUVWXYZ@#$&*0123456789abcdefghijklmnopqrstuvwxyz";
        var password = "pass";
        var user = "user";
        for (var i = 0, n = charset.length; i < passLength; ++i) {
            password += charset.charAt(Math.floor(Math.random() * n));
        }
        for (var i = 0, n = charset.length; i < userLength; ++i) {
            user += charset.charAt(Math.floor(Math.random() * n));
        }
    return {user, password}
}

exports.uint64ToVerusFloat = uint64ToVerusFloat;
exports.weitoEther = weitoEther;
exports.convertVerusAddressToEthAddress = convertVerusAddressToEthAddress;
exports.removeHexLeader = removeHexLeader;
exports.splitSignatures = splitSignatures;
exports.splitSignature = splitSignature;
exports.convertToRAddress = convertToRAddress;
exports.convertToUint256 = convertToUint256;
exports.addBytesIndicator = addBytesIndicator;
exports.convertToCurrencyValues = convertToCurrencyValues;
exports.increaseHexByAmount = increaseHexByAmount;
exports.writeVarInt = writeVarInt;
exports.readVarInt = readVarInt;
exports.writeCompactSize = writeCompactSize;
exports.uint160ToVAddress = uint160ToVAddress;
exports.ethAddressToVAddress = uint160ToVAddress;
exports.hexAddressToBase58 = hexAddressToBase58;
exports.writeUInt160LE = writeUInt160LE;
exports.writeUInt256LE = writeUInt256LE;
exports.writeUInt = writeUInt;
exports.GetMMRProofIndex = GetMMRProofIndex;
exports.convertToInt64 = convertToInt64;
exports.addHexPrefix = addHexPrefix;
exports.serializeCCurrencyValueMapArray = serializeCCurrencyValueMapArray;
exports.serializeReserveCurrenciesArray = serializeReserveCurrenciesArray;
exports.serializeReserveWeightsArray = serializeReserveWeightsArray;
exports.serializeReservesArray = serializeReservesArray; 
exports.serializeIntArray = serializeIntArray;
exports.BigDecimal = BigDecimal;
exports.encodeSignatures = encodeSignatures;
exports.randomPassAndUser = randomPassAndUser;
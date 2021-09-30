const Web3 = require('web3');
const BigNumber = require('bignumber.js');
const bitGoUTXO = require('bitgo-utxo-lib');
const fs = require('fs');
const homedir = require('os').homedir();
const confFile = require('./confFile.js')
const {  addHexPrefix } = require('ethereumjs-util');



module.exports = function() { 


this.uint64ToVerusFloat = (number) => {
    var inter =  (BigInt(number) / BigInt(100000000)) + '.';
    var decimalp = "" + (BigInt(number) % BigInt(100000000));

    while(decimalp.length < 8){
        decimalp = "0" + decimalp;
    }
    return (inter + decimalp)
}

this.weitoEther = (number) => {
    var inter =  (BigInt(number) / BigInt(1000000000000000000)) + '.';
    var decimalp = "" + (BigInt(number) % BigInt(1000000000000000000));

    while(decimalp.length < 18){
        decimalp = "0" + decimalp;
    }
    return (inter + decimalp)
}

this.convertVerusAddressToEthAddress = (verusAddress) => {
    return "0x"+ bitGoUTXO.address.fromBase58Check(verusAddress).hash.toString('hex');
}

splitSignature = (fullSig) => {

    let vArray = Uint8Array.from(Buffer.from(fullSig.substr(0,2),'hex'));
    let vVal = vArray[0];
    let rVal = addHexPrefix(fullSig.substr(2,64));
    let sVal = addHexPrefix(fullSig.substr(66,64));
    //need to keep v as a uint8 because otherwise web3 doesnt like it  
    return {vVal,rVal,sVal};
}

this.splitSignatures = (fullSigs) => {
    let vs = [];
    let rs =[];
    let ss = [];
    for(let i = 0;i<fullSigs.length;i++){
        let splitSig = splitSignature(fullSigs[i]);
        vs.push(splitSig.vVal);
        rs.push(splitSig.rVal);
        ss.push(splitSig.sVal);
    }
    return {vsVals:vs,rsVals:rs,ssVals:ss};
}

this.convertToRAddress = (RAddress) => {
    return "0x" + bitGoUTXO.address.fromBase58Check(RAddress).hash.toString('hex');
 } 

 this.convertToUint256 = (inputNumber) => {
    return new BigNumber(inputNumber * 10e+18);
}

this.convertToInt64 = (inputNumber) => {
    let coin = 100000000;
    return inputNumber * coin;
}

this.addBytesIndicator = (input) => {
    return '0x' + input;
}

this.convertToCurrencyValues = (input) => {
    let keys = Object.keys(input);
    let values = Object.values(input);
    let ccurrency = [];
    for(let i = 0;i < input.length;i++){
        ccurrency.push({currency: keys[i],amount: values[i]});
    }
    return ccurrency;
}

this.increaseHexByAmount = (hex,amount) => {
    let x = new BigNumber(hex);
    let sum = x.plus(amount);
    let result = '0x' + sum.toString(16);
    return result;
}

this.writeVarInt = (newNumber) => {
    //   console.log(newNumber);
       //let tmp = Array(Math.floor((sizeofInt(newNumber)*8+6)/7));
       let tmp = [];
       let len = 0;
       while(true){
           tmp[len] = (newNumber & 0x7f) | (len ? 0x80 : 0x00);
           if(newNumber <= 0x7f) break;
           for(let i = 0; i < 7; i++)
               newNumber = Math.floor(newNumber / 2 );  //java cant to bit shifts
           newNumber = newNumber -1 ;
           len++;
       }
       //reverse the array return it as a buffer
       tmp = tmp.reverse();
       return Buffer.from(tmp);
   }
   
   this.readVarInt = (data) => {
       let n = 0;
       let is = Buffer.from(data,'hex');
       let pos = 0;
       while(true) {
           let chData = is.readUInt8(pos); //single char
           pos++;
           n = (n << 7) | (chData & 0x7F);
           if (chData & 0x80)
               n++;
           else
               return n;
       }
   }
   
   this.writeCompactSize = (newNumber) => {
       let outBuffer = Buffer.alloc(1);
       if (newNumber < 253)
       {   
           outBuffer.writeUInt8(newNumber);
       }
       else if (newNumber <= 0xFFFF)
       {   
           outBuffer.writeUInt8(253);
           let secondBuffer = Buffer.alloc(2);
           secondBuffer.writeUInt16LE(newNumber);
           outBuffer = Buffer.concat([outBuffer,secondBuffer]);
       }
       else if (newNumber <= 0xFFFFFFFF)
       {   
           outBuffer.writeUInt8(254);
           let secondBuffer = Buffer.alloc(4);
           secondBuffer.writeUInt32LE(newNumber);        
           outBuffer = Buffer.concat([outBuffer,secondBuffer]);
       }
       else
       {
           outBuffer.writeUInt8(255);
           let secondBuffer = Buffer.alloc(8);
           secondBuffer.writeUInt32LE(newNumber);        
           outBuffer = Buffer.concat([outBuffer,secondBuffer]);
       }
       return outBuffer;
   }
   
   this.removeHexLeader = (hexString) => {
       if(hexString.substr(0,2) == '0x') return hexString.substr(2);
       else return hexString;
   }
   
   this.uint160ToVAddress = (number,version) => {
       let ashex = BigInt(number).toString(16);
       return(bitGoUTXO.address.toBase58Check(Buffer.from(ashex,'hex'),version));
   }
   
   this.ethAddressToVAddress = (ethAddress,version) => {
       return(bitGoUTXO.address.toBase58Check(Buffer.from(removeHexLeader(ethAddress),'hex'),version));
   }
   
   this.writeUInt160LE = (uint160le) => {
       let output = Buffer.alloc(20);
       output.write(String(uint160le));
       return output;
   }
   
   this.writeUInt256LE = (uint256le) => {
       //remove the 0x 
       if(uint256le.substr(0,2) == '0x') uint256le = uint256le.substr(2);
       let output = Buffer.alloc(32);
       output.write(uint256le,'hex');
       return output;
   }

   this.innerParse = (params) =>{

    let retval = {};
    let keys = Object.keys(params);
    
        for(const vals of keys){
            let i = 0;  
            let temp = parseInt(vals);
            if(isNaN(temp)){
    
                if(typeof params[vals] == "string"){
                    retval[vals] = params[vals];
                }         
                else{
                    
                    let test = Object.keys(params[vals]);
                    let objectType = 0;
                    for(const arraySub of test) {
                        let temp2 = parseInt(arraySub);
                        
                        if(isNaN(temp2))
                        objectType = 1;
                    }
                    if(objectType == 0){
                        retval[vals] = []; 
                        retval[vals][i] = innerParse(params[vals][i]);
                        i++;
                    }
                    else{
                        retval[vals] = innerParse(params[vals]);
                        i++;
                    }
                }
            }
        }
    return retval
    }

    this.parseContractExports = (params) =>{

        let retval = [];
        for(let i = 0;i < params.length; i++){ 
            retval[i] = innerParse(params[i])
        }
        return retval;
    }

    this.writeUInt = (uint,uintType) => {
        let outBuffer = null;
        switch (uintType){
            case 16 :
                outBuffer = Buffer.alloc(2);
                outBuffer.writeUInt16LE(uint);
                //writeUInt16LE(uint);
                break;
            case 32 :
                outBuffer = Buffer.alloc(4);
                outBuffer.writeUInt32LE(uint);
                break;
            case 64 :
                outBuffer = Buffer.alloc(8);
                outBuffer.writeBigInt64LE(BigInt(uint));
                break;
            case 160 :
                outBuffer = writeUInt160LE(uint);
                break;
            case 256 :
                outBuffer = writeUInt256LE(uint);
                break;
            default:
                outBuffer = Buffer.alloc(1);
                outBuffer.writeUInt8(uint);          
        }
        return outBuffer;
    }

    this.GetMMRProofIndex = (pos,mmvSize,extraHashes) => {

        let index = 0;
        let layerSizes = [];
        let merkleSizes = [];
        let peakIndexes = [];
        let bitPos = 0;

        //start at the begiining o
        //create a simulation of a mmr based on size
        if(!(pos > 0 && pos < mmvSize)) return index;

        //create an array of all the sizes
        while(mmvSize){
            layerSizes.push(mmvSize);
            mmvSize = mmvSize >> 1
        }
        
        for(let height = 0;height < layerSizes.length;height++){

            if(height == layerSizes.length -1 || layerSizes[height] & 1){

                peakIndexes.push(height);

            }

        }
        //array flip peak indexes
        peakIndexes.reverse();

        let layerNum = 0;
        let layerSize = peakIndexes.length;

        for(let passThrough = (layerSize & 1); layerNum == 0 || layerSize > 1; passThrough = (layerSize & 1),layerNum++){
            layerSize = (layerSize >> 1) + passThrough;
            if(layerSize){
                merkleSizes.push(layerSize);
            }
        }
        //flip the merklesizes

        for(let i = 0; i < extraHashes; i++){
            bitPos++;
        }

      
        let p = pos;
        for(let l = 0; l< layerSizes.length; l++){
            if(p & 1){
                index |= 1 << bitPos++;
                p >>= 1;
            
                for(let i=0; i < extraHashes; i++){
                    bitPos++;
                }

            } else {
                if(layerSizes[l] > (p + 1)){

                    bitPos++;
                    p >>= 1;
                    for (let i = 0; i < extraHashes; i++)
                    {
                        bitPos++;
                    }
                } else {

                    for (p = 0; p < peakIndexes.length; p++){

                        if (peakIndexes[p] == l)
                        {
                            break;
                        }
                    }
                    
                    for(let layerNum = -1,layerSize = peakIndexes.length; layerNum == -1 || layerSize > 1; layerSize = merkleSizes[++layerNum]){
                       
                        if (p < (layerSize - 1) || (p & 1))
                        {
                       
                       
                            if (p & 1)
                            {
                                // hash with the one before us
                                index |= 1 << bitPos;

                                for (let i = 0; i < extraHashes; i++)
                                {
                                    bitPos++;
                                }
                            }
                            else
                            {
                                // hash with the one in front of us
                                bitPos++;

                                for (let i = 0; i < extraHashes; i++)
                                {
                                    bitPos++;
                                }
                            }
                        }
                        p >>=1;
                    }

                    break;
                }

            }
        }
        return index;
    }


}
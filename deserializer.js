
require('./utils.js')();


extractPartial = (proof) => {

    let proofBuffer = [];

    for(let i = 0; i< proof.length; i++) {  // std::vector<uint256> branch;
        let hashtransfers = proof[i].exportinfo.hashtransfers;
        proofBuffer.push({hashtransfers, stream: Buffer.from(removeHexLeader(proof[i].partialtransactionproof[0]),'hex'), output: {}});
    }
    return proofBuffer;
}

readVarIntPos = (memory) => {
    let n = 0;
    let is = memory.stream.slice(0,16);  //varints bigger than 16 will fail
 
    let pos = 0;
    while(true) {
        let chData = is.readUInt8(pos); //single char
        pos++;
        n = (n * 128) | (chData & 0x7F);
        if (chData & 0x80)
            n++;
        else
       { memory.stream = memory.stream.slice(pos);
            return {retval:n, memory};}
    }
}

readCompactInt = (memory) => {

    let temp = memory.stream;
    let is = memory.stream.slice(0,16);  //varints bigger than 16 will fail
    var retval = null;
    var  chSize = is.readUInt8(0);
   
    if (chSize < 253)
    {
        retval = chSize;
        memory.stream = temp.slice(1);
    }
    else if (chSize == 253)
    {
        retval = temp.readUInt16LE(1,is);
        memory.stream = temp.slice(3);
    }
    else if (chSize == 254)
    {
        retval = ser_readdata32(1,is);
        memory.stream = temp.slice(4);
    }

 
    return {retval, memory};
    
}

readtype = (memory, type, amount) => {

    let retval = null;

    if(type == "uint"){
        switch(amount){
            case 8:
            retval = memory.stream.readUInt8(0);
            memory.stream = memory.stream.slice(1);
            break;

            case 16:
            retval = memory.stream.readUInt16LE(0);
            memory.stream = memory.stream.slice(2);
            break;

            case 32:
            retval = memory.stream.readUInt32LE(0);
            memory.stream = memory.stream.slice(4);
            break;

            case 64:
            retval = "0x" + memory.stream.slice(0,8).toString('hex');
            memory.stream = memory.stream.slice(8);
            break;

            case 160:
            retval = "0x" + memory.stream.slice(0,20).toString('hex');
            memory.stream = memory.stream.slice(20);
            break;

            case 256:
            retval = "0x" + memory.stream.slice(0,32).toString('hex');
            memory.stream = memory.stream.slice(32);
            break;
        }

    }
    else if(type == "array")
    {
        retval = "0x" + memory.stream.slice(0, amount).toString('hex');
        memory.stream = memory.stream.slice(amount);
    }

    return {retval, memory}
} 

readCMMRNodeBranch = (memory) =>{

    temp =  readtype(memory,'uint',8);
    memory = temp.memory;
    let CMerkleBranchBase = temp.retval  // TODO:Always CMMRNodeBranch

    temp =  readVarIntPos(memory);
    memory = temp.memory;
    let nIndex = temp.retval

    temp =  readVarIntPos(memory);
    memory = temp.memory;
    let nSize = temp.retval

    let extrahashes = 0;

    if(CMerkleBranchBase == 3) {
        extrahashes = 1 ;
        }
    let txHeight = nIndex;  //this is the height of the transaction put it into a global
    nIndex = GetMMRProofIndex(nIndex,nSize,extrahashes)

    temp =  readtype(memory,'uint',8);
    memory = temp.memory;
    let vectorsize = temp.retval  
    let branch = [];
    
    for(let i = 0; i< vectorsize; i++){  // std::vector<uint256> branch;
    
        temp =  readtype(memory,'uint',256);
        memory = temp.memory;
        branch.push(temp.retval);  
    
    }

    return {retval:{CMerkleBranchBase, nIndex, nSize, branch, txHeight}, memory}
}



txProof = (memory) => {
   
    //CMMRProof
    var retval = [];
    let temp = null;
    
    temp =  readtype(memory,'uint',32);
    memory = temp.memory;
    let proofSize = temp.retval;

    
    for(let i = 0; i< proofSize; i++){  //std::vector<CMMRNodeBranch> proofSequence;

        temp =  readtype(memory,'uint',8);
        memory = temp.memory;
        let branchType = temp.retval  // TODO:Always CMMRNodeBranch 2 or 3?? check

        temp =  readCMMRNodeBranch(memory);
        memory = temp.memory;
        
        var proofSequence =  temp.retval;
        
        
        
        retval.push({branchType, proofSequence});

    }

    return {retval, memory}
}

readComponents = (memory) => {
    
    temp =  readtype(memory,'uint',8);
    memory = temp.memory;
    let compsize = temp.retval 

    let retval = [];

    for(let i = 0; i< compsize; i++) {  //std::vector<CMMRNodeBranch> proofSequence;

        temp =  readtype(memory,'uint',16);
        memory = temp.memory;
        let elType = temp.retval   

        temp =  readtype(memory,'uint',16);
        memory = temp.memory;
        let elIdx = temp.retval  

        //todo readcompactint for std::vector<unsigned char> elVchObj; 
        temp =  readCompactInt(memory);
        memory = temp.memory;
        let compactint = temp.retval 

        let elVchObj = {};
        if(elType == 2) {
            temp =  readtype(memory, 'array', 36);
            memory = temp.memory;

            let end = compactint - 40;
            elVchObj = temp.retval + memory.stream.slice(end, end + 4).toString('hex') ; 

            memory.stream = memory.stream.slice(compactint - 36);
        }
        else
        {
            elVchObj = "0x" + memory.stream.slice(0, compactint).toString('hex') ; 
            memory.stream = memory.stream.slice(compactint);
        }

        temp =  txProof(memory);
        memory = temp.memory;
        let elProof = temp.retval

        retval.push({elType, elIdx, elVchObj, elProof})
    }
    return {retval, memory}
}


partialTransactionProof = (memory) => {

    //PartialTransactionProof
    let temp = null;
    
    temp =  readtype(memory,'uint',8);
    memory = temp.memory;
    let version = temp.retval

    temp =  readtype(memory,'uint',8);
    memory = temp.memory;
    let typeC = temp.retval
    
    temp =  txProof(memory);
    memory = temp.memory;
    let txproof = temp.retval

    temp =  readComponents(memory);
    memory = temp.memory;
    let components = temp.retval


    let retval =
    {
        version: version,
        typeC: typeC,
        txproof: txproof,
        components: components
    }
 
    //   console.log(JSON.stringify(retval));
     return retval;
}


/*******Transaction functions for VchObj******* */

VCFDeserialize = (array, size) => {


    let temp = readtype(array,'uint',256); 
    array = temp.memory; 
    return retval


}

CTransactionHeader = (elVchObj) =>{

    let array = {};
    array.stream = Buffer.from(removeHexLeader(elVchObj),'hex');

    let retval = 
        {
        txHash: readtype(array,'uint',256).retval,
        fOverwintered: readtype(array,'uint',8).retval,
        nVersion: readtype(array,'uint',32).retval,
        nVersionGroupId: readtype(array,'uint',32).retval,
        nVins: readtype(array,'uint',32).retval,
        nVouts: readtype(array,'uint',32).retval,
        nShieldedSpends: readtype(array,'uint',32).retval,
        nShieldedOutputs: readtype(array,'uint',32).retval,
        nLockTime: readtype(array,'uint',32).retval,
        nExpiryHeight: readtype(array,'uint',32).retval,
        nValueBalance: readtype(array,'uint',64).retval
     }

    return retval;
}


mtxVin = (elVchObj, index) => {

    let array = {};
    array.stream = Buffer.from(removeHexLeader(elVchObj),'hex');

    let retval = 
    {prevouthash: readtype(array,'uint',256).retval, 
     n: readtype(array,'uint',32).retval ,
    scriptSig: readtype(array,'uint',8).retval,
    nSequence: readtype(array,'uint',32).retval,
    index}

    return retval;

}

mtxVout = (elVchObj, index) => {
    
    let array = {};
    array.stream = Buffer.from(removeHexLeader(elVchObj),'hex');

    let retval = null;

    let nValue =  readtype(array,'uint',64).retval;

    let compactint =  readCompactInt(array).retval;
    
    let scriptPubKey = array.stream.slice(0,compactint).toJSON().data ; array.stream = array.stream.slice(compactint);

    let hashPosition = 1;
    retval = {nValue,scriptPubKey,index, hashPosition}

    return retval;
    
}

processVCH = (partialProof) => {

    if(!(partialProof.merkleproof))
        partialProof.merkleproof = [];
    
      //  partialProof.merkleproof.headers = CTransactionHeader(partialProof.components[0].elVchObj);  HEADER NOT NEEDED as deserialised
    
    for(let i = 1; i< partialProof.components.length; i++){ 

        switch(partialProof.components[i].elType){
            

            case 2:  
            case 3: // partialProof.merkleproof.vins.push(mtxVin(partialProof.components[i].elVchObj,i)); vins not needed deserialised
            
            break;
    
            case 4: partialProof.vouts.push(mtxVout(partialProof.components[i].elVchObj,i));
            
            
            break;
    
        }
    }

    return partialProof;

}

module.exports = function() { 
    
this.deSerializeMMR = (exports) => {
    
   let partialProofsObject =  extractPartial(exports);
   let output =[];

   for(const partialProof of partialProofsObject){
        output.push(partialTransactionProof(partialProof)); 
    }

    for(let i = 0; i< exports.length; i++){ 
        exports[i].partialtransactionproof =  output[i];
    }
  
    return exports
    }

    
    this.insertHeights = (exports) => {
        
       let output =[];
    
       for(const objects of exports){
            objects.height = objects.partialtransactionproof.txproof[objects.partialtransactionproof.txproof.length - 1].proofSequence.txHeight;

            output.push(objects); 
        }
    
        return output
    }
}
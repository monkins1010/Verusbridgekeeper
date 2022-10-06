const util = require('./utils.js');


function extractPartial(proof) {

    let proofBuffer = [];

    for (let i = 0; i < proof.length; i++) { // std::vector<uint256> branch;
        let hashtransfers = proof[i].exportinfo.hashtransfers;
        proofBuffer.push({ hashtransfers, stream: Buffer.from(util.removeHexLeader(proof[i].partialtransactionproof[0]), 'hex'), output: {} });
    }
    return proofBuffer;
}

function readVarIntPos(memory) {
    let n = 0;
    let is = memory.stream.slice(0, 16); //varints bigger than 16 will fail

    let pos = 0;
    // eslint-disable-next-line no-constant-condition
    while (true) {
        let chData = is.readUInt8(pos); //single char
        pos++;
        n = (n * 128) | (chData & 0x7F);
        if (chData & 0x80)
            n++;
        else {
            memory.stream = memory.stream.slice(pos);
            return { retval: n, memory };
        }
    }
}

function readCompactInt(memory) {

    let temp = memory.stream;
    let is = memory.stream.slice(0, 16); //varints bigger than 16 will fail
    var retval = null;
    var chSize = is.readUInt8(0);

    if (chSize < 253) {
        retval = chSize;
        memory.stream = temp.slice(1);
    } else if (chSize == 253) {
        retval = temp.readUInt16LE(1, is);
        memory.stream = temp.slice(3);
    } else if (chSize == 254) {
        retval = temp.ser_readdata32(1, is);
        memory.stream = temp.slice(4);
    }


    return { retval, memory };

}

function readtype(memory, type, amount) {

    let retval = null;

    if (type == "uint") {
        switch (amount) {
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
                retval = "0x" + memory.stream.slice(0, 8).toString('hex');
                memory.stream = memory.stream.slice(8);
                break;

            case 160:
                retval = "0x" + memory.stream.slice(0, 20).toString('hex');
                memory.stream = memory.stream.slice(20);
                break;

            case 256:
                retval = "0x" + memory.stream.slice(0, 32).toString('hex');
                memory.stream = memory.stream.slice(32);
                break;
        }

    } else if (type == "array") {
        retval = "0x" + memory.stream.slice(0, amount).toString('hex');
        memory.stream = memory.stream.slice(amount);
    }

    return { retval, memory }
}

function readCMMRNodeBranch(memory) {

    let temp = readtype(memory, 'uint', 8);
    memory = temp.memory;
    let CMerkleBranchBase = temp.retval // TODO:Always CMMRNodeBranch

    temp = readVarIntPos(memory);
    memory = temp.memory;
    let nIndex = temp.retval

    temp = readVarIntPos(memory);
    memory = temp.memory;
    let nSize = temp.retval

    let extraHashes = 0;

    if (CMerkleBranchBase == 3) {
        extraHashes = 1;
    }
    let txHeight = nIndex; //this is the height of the transaction put it into a global
    //TODO: remove MMR function and pass in nIndex untouched
    //nIndex = util.GetMMRProofIndex(nIndex, nSize, extraHashes)

    temp = readtype(memory, 'uint', 8);
    memory = temp.memory;
    let vectorsize = temp.retval
    let branch = [];

    for (let i = 0; i < vectorsize; i++) { // std::vector<uint256> branch;

        temp = readtype(memory, 'uint', 256);
        memory = temp.memory;
        branch.push(temp.retval);

    }

    return { retval: { CMerkleBranchBase, nIndex, nSize, extraHashes, branch, txHeight }, memory }
}



function txProof(memory) {

    //CMMRProof
    var retval = [];
    let temp = null;

    temp = readtype(memory, 'uint', 32);
    memory = temp.memory;
    let proofSize = temp.retval;


    for (let i = 0; i < proofSize; i++) { //std::vector<CMMRNodeBranch> proofSequence;

        temp = readtype(memory, 'uint', 8);
        memory = temp.memory;
        let branchType = temp.retval // TODO:Always CMMRNodeBranch 2 or 3?? check

        temp = readCMMRNodeBranch(memory);
        memory = temp.memory;

        var proofSequence = temp.retval;



        retval.push({ branchType, proofSequence });

    }

    return { retval, memory }
}

function readComponents(memory) {

    let temp = readtype(memory, 'uint', 8);
    memory = temp.memory;
    let compsize = temp.retval

    let retval = [];

    for (let i = 0; i < compsize; i++) { //std::vector<CMMRNodeBranch> proofSequence;

        temp = readtype(memory, 'uint', 16);
        memory = temp.memory;
        let elType = temp.retval

        temp = readtype(memory, 'uint', 16);
        memory = temp.memory;
        let elIdx = temp.retval

        //todo readcompactint for std::vector<unsigned char> elVchObj; 
        temp = readCompactInt(memory);
        memory = temp.memory;
        let compactint = temp.retval

        let elVchObj = {};
        if (elType == 2) {
            temp = readtype(memory, 'array', 36);
            memory = temp.memory;

            let end = compactint - 40;
            elVchObj = temp.retval + memory.stream.slice(end, end + 4).toString('hex');

            memory.stream = memory.stream.slice(compactint - 36);
        } else {
            elVchObj = "0x" + memory.stream.slice(0, compactint).toString('hex');
            memory.stream = memory.stream.slice(compactint);
        }

        temp = txProof(memory);
        memory = temp.memory;
        let elProof = temp.retval

        retval.push({ elType, elIdx, elVchObj, elProof })
    }
    return { retval, memory }
}


function partialTransactionProof(memory) {

    //PartialTransactionProof
    let temp = null;

    temp = readtype(memory, 'uint', 8);
    memory = temp.memory;
    let version = temp.retval

    temp = readtype(memory, 'uint', 8);
    memory = temp.memory;
    let typeC = temp.retval

    temp = txProof(memory);
    memory = temp.memory;
    let txproof = temp.retval

    temp = readComponents(memory);
    memory = temp.memory;
    let components = temp.retval


    let retval = {
        version: version,
        typeC: typeC,
        txproof: txproof,
        components: components
    }

    //   console.log(JSON.stringify(retval));
    return retval;
}



const deSerializeMMR = (exports) => {

    let partialProofsObject = extractPartial(exports);
    let output = [];

    for (const partialProof of partialProofsObject) {
        output.push(partialTransactionProof(partialProof));
    }

    for (let i = 0; i < exports.length; i++) {
        exports[i].partialtransactionproof = output[i];
    }

    return exports
}


const insertHeights = (exports) => {

    let output = [];

    for (const objects of exports) {
        objects.height = objects.partialtransactionproof.txproof[objects.partialtransactionproof.txproof.length - 1].proofSequence.txHeight;

        output.push(objects);
    }

    return output
}

exports.deSerializeMMR = deSerializeMMR;
exports.insertHeights = insertHeights;
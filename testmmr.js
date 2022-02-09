GetMMRProofIndex = (pos,mmvSize,extraHashes) => {
    let index = Long(0, 0);
    let layerSizes = [];
    let merkleSizes = [];
    let peakIndexes = [];
    let bitPos = 0;

    //start at the beginning
    //create a simulation of a mmr based on size
    if(!(pos > 0 && pos < mmvSize)) return 0;

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
        if(p & 1) {
            index.or(Long(1, 0, true).shl(bitPos++));

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
                            index.or(Long(1, 0, true).shl(bitPos++));

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
    return index.toNumber();
}

GetMMRProofIndex(926,930,1);
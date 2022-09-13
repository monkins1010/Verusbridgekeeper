const Cache = require("react-native-cache")

const CACHE_CAP = 100

let apiCache = new Cache.Cache({
  namespace: "api",
  policy: {
      maxEntries: CACHE_CAP
  },
})

exports.initApiCache = () => {
    return apiCache.initializeCache().catch(e => {
      console.log("Error while initializing Api cache")
      throw e
    })
}
// {input: inputQuery, value: outputoVerusAPI}
exports.checkCachedApiTwo = async (call, inputQuery) => {
    let key1 = `${call}1`
    let key2 = `${call}2`

    try 
    {
        let result1 =  await apiCache.getItem(key1);
        let result2 =  await apiCache.getItem(key2);
        let strResult1 = result1 ? JSON.stringify(JSON.parse(result1).input) : null
        let strResult2 = result2 ? JSON.stringify(JSON.parse(result2).input) : null
        let strInput = JSON.stringify(inputQuery)

        if (strInput == strResult1)
        {
            return JSON.parse(result1).value;
        }
        else if (strInput == strResult2)
        {
            return JSON.parse(result2).value;
        }
        else
        {
            return null;
        }
       
    } 
    catch(e) 
    {
        console.log("Error while getting Api cache")
        throw e
    }
}

exports.setCachedApiTwo = async (result, input, call) => {
    let key1 = `${call}1`
    let key2 = `${call}2`

    let result1 =  await apiCache.getItem(key1);
    let result2 =  await apiCache.getItem(key2);
    let newresult =  JSON.stringify({input: input, value: result});
    try 
    {
        if (result1 == newresult)
        {
            return; 
        }
        
        else if  (result2 == newresult)
        {
            return; 
        }

        else
        {
            await apiCache.setItem(key1, newresult);

            if (result1 != null)
            {
                await apiCache.setItem(key2, result2);
            }
        }    
    }
    catch(e) 
    {
        console.log("Error while getting Api cache")
        throw e
    }
}

exports.getCachedApi = async (call) => {
    let key = `${call}`

    try 
    {
       return await apiCache.getItem(key);
    } 
    catch(e) 
    {
        console.log("Error while getting Api cache")
        throw e
    }
}

exports.setCachedApi = async (ApiObj, call) => {
    let key = `${call}`

    try 
    {
        return await apiCache.setItem(key, JSON.stringify(ApiObj));
    } 
    catch(e) 
    {
         console.log("Error while setting Api cache")
         throw e
    }
}

exports.clearCachedApis = () => {
    console.log("Clearing block Api cache")
    return apiCache.clearAll().catch(e => {
        console.log("Error while clearing Api cache")
        throw e
    })
}

exports.getapiCache = () => {
    return apiCache.getAll().catch(e => {
        console.log("Error while getting all Api cache")
        throw e
    })
}

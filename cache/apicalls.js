const Cache = require("react-native-cache")

const CACHE_CAP = 100

let apiCache = new Cache.Cache({
  namespace: "api",
  policy: {
      maxEntries: CACHE_CAP
  },
})

let blockCache = new Cache.Cache({
    namespace: "blocks",
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

exports.initBlockCache = () => {
    return blockCache.initializeCache().catch(e => {
      console.log("Error while initializing Block cache")
      throw e
    })
}
// {input: inputQuery, value: outputoVerusAPI}
exports.checkCachedApi = async (call, inputQuery) => {
    let key = `${call}${JSON.stringify(inputQuery)}`

    try 
    {
        let result =  await apiCache.getItem(key);

        if (result)
        {
            return JSON.parse(result);
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

exports.setCachedApiValue = async (result, input, call) => {
    let key = `${call}${JSON.stringify(input)}`

    let newResult = JSON.stringify(result);

    try 
    {
        await apiCache.setItem(key, newResult);
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

exports.getCachedBlock = async (call) => {
    let key = `${call}`

    try 
    {
       return await blockCache.getItem(key);
    } 
    catch(e) 
    {
        console.log("Error while getting Api cache")
        throw e
    }
}

exports.setCachedBlock = async (ApiObj, call) => {
    let key = `${call}`

    try 
    {
        return await blockCache.setItem(key, JSON.stringify(ApiObj));
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

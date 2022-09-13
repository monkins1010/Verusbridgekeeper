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

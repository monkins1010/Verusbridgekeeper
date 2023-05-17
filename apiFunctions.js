
exports.APIs = (api) => {
    
    let validCalls = {
        'submitimports'                 : "submitImports",
        "getinfo"                       : "getInfo",
        'getexports'                    : "getExports",
        'getcurrency'                   : "getCurrency",
        'submitacceptednotarization'    : "submitAcceptedNotarization",
        'getnotarizationdata'           : "getNotarizationData",
        'getbestproofroot'              : "getBestProofRoot",
        'getlastimportfrom'             : "getLastImportFrom",
        'getclaimablefees'              : "getclaimablefees"
    }

    for ( var property in validCalls ) {

        if(api == property){
            return validCalls[property];
        }

    }

    return "invalid"

}


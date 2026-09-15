
exports.APIs = (api) => {
    
    let validCalls = {
        'submitimports'                 : "submitImports",
        'approveorrejectacceptedimport' : "approveOrRejectAcceptedImport",
        "getinfo"                       : "getInfo",
        'getexports'                    : "getExports",
        'getcurrency'                   : "getCurrency",
        'submitacceptednotarization'    : "submitAcceptedNotarization",
        'getnotarizationdata'           : "getNotarizationData",
        'getbestproofroot'              : "getBestProofRoot",
        'getlastimportfrom'             : "getLastImportFrom",
        'getpendingqueuestate'          : "getPendingQueueState",
        'getbridgestatus'               : "getBridgeStatus",
        'getclaimablefees'              : "getclaimablefees",
        'revokeidentity'                : "revokeidentity",
        'stop'                          : "stop",
    }

    for ( var property in validCalls ) {

        if(api == property) {
            return validCalls[property];
        }
    }

    return "invalid"
}


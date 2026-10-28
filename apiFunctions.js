
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
        'getpendingqueuestate'          : "getPendingQueueState",
        'getbridgestatus'               : "getBridgeStatus",
        'getclaimablefees'              : "getclaimablefees",
        'revokeidentity'                : "revokeidentity",
        'stop'                          : "stop",
        'approveorrejectacceptedimport' : "approveOrRejectAcceptedImport",
    }

    // only an exact string match dispatches; ["submitimports"] would otherwise match through ==
    if (typeof api !== 'string' || !Object.prototype.hasOwnProperty.call(validCalls, api)) {
        return "invalid";
    }

    return validCalls[api];
}


module.exports = Object.freeze({
    
    VDXFDATAKEY: {VRSCTEST: "bb29b6fbac51550f7bda924d73c8e0bc971fb1dc",
                  VRSC:     "8cea50fa0fc6787f0ff3d68858b2fadd36e7a485"},
    VETHCURRENCYID: "iCtawpxUiCc2sEupt7Z4u8SDAncGZpgSKm",
    VERUSSYSTEMID:  "iJhCezBExJHvtyH3fGhNnt2NhU4Ztkf2yq",
    BRIDGEIDHEX: "0xffece948b8a38bbcc813411d2597f7f8485a0689",
    BRIDGEID: "iSojYsotVzXz4wh2eJriASGo6UidJDDhL2",

    FLAG_DEFINITION_NOTARIZATION : 1,   // initial notarization on definition of currency/system/chain
    FLAG_PRE_LAUNCH : 2,                // pre-launch notarization
    FLAG_START_NOTARIZATION : 4,        // first notarization after pre-launch
    FLAG_LAUNCH_CONFIRMED : 8,
    FLAG_REFUNDING : 0x10,
    FLAG_ACCEPTED_MIRROR : 0x20,        // if this is set, this notarization is a mirror of an earned notarization on another chain
    FLAG_BLOCKONE_NOTARIZATION : 0x40,  // block 1 notarizations are auto-finalized, the blockchain itself will be worthless if it is wrong
    FLAG_SAME_CHAIN : 0x80,             // set if all currency information is verifiable on this chain
    FLAG_LAUNCH_COMPLETE : 0x100        // set if all currency information is verifiable on this chain


});
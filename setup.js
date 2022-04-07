exports.coin = {
    VRSC: {
        darwin: "/Komodo/VRSC",
        linux: "/.komodo/VRSC",
        win32: "/Komodo/VRSC"
    },
    VRSCTEST: {
        darwin: "/Komodo/vrsctest",
        linux: "/.komodo/vrsctest",
        win32: "/Komodo/vrsctest"
    },
};

exports.pbaas = {
    "000b090bec6c9ff28586eb7ed24e77562f0c4667": {
        darwin: "/pbaas/000b090bec6c9ff28586eb7ed24e77562f0c4667",
        linux: "/pbaas/000b090bec6c9ff28586eb7ed24e77562f0c4667",
        win32: "/pbaas/000b090bec6c9ff28586eb7ed24e77562f0c4667"
    },
};

exports.pbaasRoot = {
    VRSCTEST: {
        darwin: "/VerusTest",
        linux: "/.verustest",
        win32: "/VerusTest"
    },
    VRSC: {
        darwin: "/Verus",
        linux: "/.verus",
        win32: "/Verus"
    },
};

exports.RPCDefault = {
    VRSCTEST: {
        rpcuser: "empty",
        rpcpassword: "empty",
        rpcport: 8000,
        rpchost: "empty",
        verusbridgeaddress: "0x78E3b8D9A42680bDf8c93681fc04e97c6AFCa04E",
        storageaddress: "0x78E3b8D9A42680bDf8c93681fc04e97c6AFCa04E",
        testnet: true,
        privateKey: "empty",
        ethNode: "wss://rinkeby.infura.io/ws/v3/..............",
    },
    VRSC: {
        rpcuser: "username",
        rpcpassword: "password",
        rpcport: 8000,
        rpchost: "127.0.0.1",
        verusbridgeaddress: "0xcD71751DB9a71DB1a7B78BccF6028aCD706d3F17",
        storageaddress: "0x78E3b8D9A42680bDf8c93681fc04e97c6AFCa04E",
        testnet: true,
        privatekey: "empty",
        ethnode: "wss://rinkeby.infura.io/ws/v3/........",
    }
}

exports.INIKeys = {
    rpcuser: '',
    rpcpassword: '',
    rpcport: '',
    rpchost: '',
    verusbridgeaddress: '',
    storageaddress: '',
    testnet: '',
    privatekey: '',
    ethnode: '',
};
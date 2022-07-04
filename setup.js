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
        rpcuser: "user",
        rpcpassword: "password",
        rpcport: 8000,
        rpchost: "127.0.0.1",
        upgrademanageraddress: "empty",
        testnet: true,
        privatekey: "empty",
        ethnode: "empty",
    },
    VRSC: {
        rpcuser: "username",
        rpcpassword: "password",
        rpcport: 8000,
        rpchost: "127.0.0.1",
        upgrademanageraddress: "empty",
        testnet: false,
        privatekey: "empty",
        ethnode: "wss://rinkeby.infura.io/ws/v3/........",
    }
}

exports.INIKeys = {
    rpcuser: '',
    rpcpassword: '',
    rpcport: '',
    rpchost: '',
    upgrademanageraddress: '',
    testnet: '',
    privatekey: '',
    ethnode: '',
};
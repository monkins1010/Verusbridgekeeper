const util = require('./utils.js');

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

exports.verusConfFile = {
    VRSCTEST: "/vrsctest.conf",
    VRSC: "/VRSC.conf"
};

exports.pbaas = {
    "000b090bec6c9ff28586eb7ed24e77562f0c4667": {
        darwin: "/pbaas/000b090bec6c9ff28586eb7ed24e77562f0c4667",
        linux: "/pbaas/000b090bec6c9ff28586eb7ed24e77562f0c4667",
        win32: "/pbaas/000b090bec6c9ff28586eb7ed24e77562f0c4667"
    },
    "52c7a71ed15802d33778235e7988d61339b84c45": {
        darwin: "/pbaas/52c7a71ed15802d33778235e7988d61339b84c45",
        linux: "/pbaas/52c7a71ed15802d33778235e7988d61339b84c45",
        win32: "/pbaas/52c7a71ed15802d33778235e7988d61339b84c45"
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

const rndDetails = util.randomPassAndUser();

exports.RPCDefault = {
    VRSCTEST: {
        rpcuser: rndDetails.user,
        rpcpassword: rndDetails.password,
        rpcport: 8000,
        delegatorcontractaddress: "empty",
        privatekey: "empty",
        ethnode: "empty",
        rpcallowip: "127.0.0.1"
    },
    VRSC: {
        rpcuser: rndDetails.user,
        rpcpassword: rndDetails.password,
        rpcport: 8002,
        delegatorcontractaddress: "empty",
        privatekey: "empty",
        ethnode: "wss://rinkeby.infura.io/ws/v3/........",
        rpcallowip: "127.0.0.1"
    }
}

exports.INIKeys = {
    rpcuser: '',
    rpcpassword: '',
    rpcport: '',
    rpchost: '',
    delegatorcontractaddress: '',
    privatekey: '',
    ethnode: '',
    rpcallowip: '',
    nowitnesssubmissions: ''
};
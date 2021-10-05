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
    VETH: {
        darwin: "/pbaas/veth",
        linux: "/pbaas/veth",
        win32: "/pbaas/veth"
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
    rpcuser:"empty",
    rpcpassword:"empty",
    rpcport:8000,
    rpchost:"empty",
    verusbridgeaddress: "0x78E3b8D9A42680bDf8c93681fc04e97c6AFCa04E",
    verusnotarizeraddress: "0x0299B608307A9a9B039BE796C13636B840b9Bb57",
    verusproofaddress: "0x8E4b4625cA5E008ECEccf183C69eDBBa81234708",
    verusinfoaddress: "0x9340d0820e88ceDc0a00E19aA510248de52cbC24",
    verusserializeraddress: "0xA5667b2DF781bFD27b90602Fe500a259F83A38D6",
    testnet:true,
    privateKey:"empty",
    ethNode:"wss://rinkeby.infura.io/ws/v3/..............",
  },
  VRSC: {
    rpcuser:"username",
    rpcpassword:"password",
    rpcport:8000,
    rpchost:"127.0.0.1",
    verusbridgeaddress:"0xcD71751DB9a71DB1a7B78BccF6028aCD706d3F17",
    verusnotarizeraddress:"0x307c31FC8264706013D81ab9b00eD13888FF33F4",
    verusproofaddress: '0x56490FbBCF8B2f66D55174cFC22e97Aa65d37914',
    verusinfoaddress: '0x1edbbA276270309E9fbEB7eB365f9426A7905762',
    verusserializeraddress: '0xF26E72090D94B3921FCb80bf67D2dFDc68cD8d30',
    testnet:true,
    privatekey:"empty",
    ethnode:"wss://rinkeby.infura.io/ws/v3/........",
  }
}

exports.INIKeys = {
  rpcuser: '',
  rpcpassword: '',
  rpcport: '',
  rpchost: '',
  verusbridgeaddress: '',
  verusnotarizeraddress: '',
  verusproofaddress: '',
  verusinfoaddress: '',
  verusserializeraddress: '',
  testnet: '',
  privatekey: '',
  ethnode: '',
};


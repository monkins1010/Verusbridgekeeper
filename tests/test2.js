const Web3 = require('web3');

const confFile = require('../confFile.js')
var constants = require('../constants');

require('../utils.js')();
require('../deserializer.js')();
const util = require('util');

const ticker = process.argv.indexOf('-production') > -1 ? "VRSC" : "VRSCTEST" ;

const settings = confFile.loadConfFile(ticker);

const web3 = new Web3(new Web3.providers.WebsocketProvider(settings.ethnode, {
    clientConfig: {
    maxReceivedFrameSize: 100000000,
    maxReceivedMessageSize: 100000000,
    keepalive: true,
    keepaliveInterval: -1 // ms
    },
    reconnect: {
        auto: true,
        delay: 5000, // ms
        maxAttempts: 5,
        onTimeout: false,
      }
}));

const verusBridgeAbi = require('../abi/VerusBridge.json');
const verusBridge = new web3.eth.Contract(verusBridgeAbi.abi, "0x74f29645c2aDD1961c54f27f7dC113aEd8320132");

const verusProofAbi = require('../abi/VerusProof.json');
const verusProof = new web3.eth.Contract(verusProofAbi.abi, "0x6ee7912466888cE1E583FB79EdE02e540Ddf22Af");

let account = web3.eth.accounts.privateKeyToAccount(settings.privatekey);
web3.eth.accounts.wallet.add(account);
web3.eth.handleRevert = true
const maxGas = 6000000;


const transaction1 = {
  "height":264,
  "txid":"0x03aa3130cec1317ccc387a4c4a3373dbff32e21fb7d18e2d293ab10b94ecb324",
  "txoutnum":0,
  "exportinfo":{
     "version":1,
     "flags":2,
     "sourcesystemid":"0x67460c2f56774ed27eeb8685f29f6cec0b090b00",
     "hashtransfers":"0xe2e4135a6a4ccb4c0e2576497759fe7698c04a074433d6cf91574876313f34eb",
     "destinationsystemid":"0xa6ef9ea235635e328124ff3429db9f9e91b64e2d",
     "destinationcurrencyid":"0x67460c2f56774ed27eeb8685f29f6cec0b090b00",
     "sourceheightstart":1,
     "sourceheightend":2,
     "numinputs":1,
     "totalamounts":[
        {
           "currency":"0xf0a1263056c30e221f0f851c36b767fff2544f7f",
           "amount":5000000000
        },
        {
           "currency":"0x67460c2f56774ed27eeb8685f29f6cec0b090b00",
           "amount":120000
        }
     ],
     "totalfees":[
        {
           "currency":"0x67460c2f56774ed27eeb8685f29f6cec0b090b00",
           "amount":120000
        }
     ],
     "totalburned":[
        {
           "currency":"0x0000000000000000000000000000000000000000",
           "amount":0
        }
     ],
     "rewardaddress":{
        "destinationtype":9,
        "destinationaddress":"0xb26820ee0c9b1276aac834cf457026a575dfce84"
     },
     "firstinput":1
  },
  "partialtransactionproof":{
     "version":1,
     "typeC":2,
     "txproof":[
        {
           "branchType":2,
           "proofSequence":{
              "CMerkleBranchBase":2,
              "nIndex":1,
              "nSize":3,
              "branch":[
                 "0xf83941711c6b1173cc758c2b3effdce6bcbb26883a2a5ed47f5f990d1b2951de"
              ],
              "txHeight":2
           }
        },
        {
           "branchType":2,
           "proofSequence":{
              "CMerkleBranchBase":2,
              "nIndex":0,
              "nSize":2,
              "branch":[
                 "0x50ad67af2866619ce26e6189d465562f8492111b57c330d6b7ae58f3ad000000"
              ],
              "txHeight":0
           }
        },
        {
           "branchType":3,
           "proofSequence":{
              "CMerkleBranchBase":3,
              "nIndex":640,
              "nSize":280,
              "branch":[
                 "0x3dbe500100000000000000000000000000000000000000000000000000000000",
                 "0x1ff56819a6997affa2c8fa6a8d706357efbda5975f6ace96056b4e69680879c7",
                 "0x9026ad0200000000000000000000000000000000000000000000000000000000",
                 "0xacca1fddcbd759d8b1bc6ead23f3f44690d221a196fbd51f4a0450f1ad589a34",
                 "0xdbf3100500000000000000000000000000000000000000000000000000000000",
                 "0x66c2f05fee681793ed339c9be8b7f9f238939292d2da18eceee03f5afe4da0c9",
                 "0x4f76680a00000000000000000000000000000000000000000000000000000000",
                 "0x683518fb64567a72c49f60df288e8f04b87e98589d12b8921528eb02f27f4f72",
                 "0x3c04a11500000000000000000000000000000000000000000000000000000000",
                 "0xda7c6fdc690b98b10a907e2a1e1579a696656cae0b155a3f6627ea102d54bcd2",
                 "0x50d5916a00000000000000000000000000000000000000000000000000000000",
                 "0x163547be7d23bb07a2db15a04ba9f1be9a2ba7fe56b9fc1b66e34f16cbe1645a",
                 "0x3209bb7600000000000000000000000000000000000000000000000000000000"
              ],
              "txHeight":264
           }
        }
     ],
     "components":[
        {
           "elType":1,
           "elIdx":0,
           "elVchObj":"0x03aa3130cec1317ccc387a4c4a3373dbff32e21fb7d18e2d293ab10b94ecb324010400000085202f8902000000010000000000000000000000000000001c0100000000000000000000",
           "elProof":[
              {
                 "branchType":2,
                 "proofSequence":{
                    "CMerkleBranchBase":2,
                    "nIndex":0,
                    "nSize":6,
                    "branch":[
                       "0x02f44c582acc41101c259c816106948ff41c01e86264adb3bf998e46ddea5204",
                       "0xa8fb338fe1d8ec976786cd6224870dce0ca4a8aa40af06071e182094a0d3741f",
                       "0x1a0e800070f543cd006d6fe7c857174934f45b628ab0f18a1c9a22bdb051cb54"
                    ],
                    "txHeight":0
                 }
              }
           ]
        },
        {
           "elType":2,
           "elIdx":0,
           "elVchObj":"0x43daa80cb69f60c79391503bcb2d0dd096f6760add771436258478d24362ec6304000000ffffffff",
           "elProof":[
              {
                 "branchType":2,
                 "proofSequence":{
                    "CMerkleBranchBase":2,
                    "nIndex":1,
                    "nSize":6,
                    "branch":[
                       "0x65b4ca3c2af26557a6fb9c24aa450979a1ee6401fb237fe0c707fc7cc70b6782",
                       "0xa8fb338fe1d8ec976786cd6224870dce0ca4a8aa40af06071e182094a0d3741f",
                       "0x1a0e800070f543cd006d6fe7c857174934f45b628ab0f18a1c9a22bdb051cb54"
                    ],
                    "txHeight":1
                 }
              }
           ]
        },
        {
           "elType":4,
           "elIdx":0,
           "elVchObj":"0x0000000000000000fd32011a04030001011452047d0db35c330271aae70bedce996b5239ca5ccc4d120104030c01011452047d0db35c330271aae70bedce996b5239ca5c4cf601008000a6ef9ea235635e328124ff3429db9f9e91b64e2de2e4135a6a4ccb4c0e2576497759fe7698c04a074433d6cf91574876313f34eb67460c2f56774ed27eeb8685f29f6cec0b090b0067460c2f56774ed27eeb8685f29f6cec0b090b0080328107010000000267460c2f56774ed27eeb8685f29f6cec0b090b00c0d4010000000000f0a1263056c30e221f0f851c36b767fff2544f7f00f2052a01000000000267460c2f56774ed27eeb8685f29f6cec0b090b00c0d4010000000000f0a1263056c30e221f0f851c36b767fff2544f7f00f2052a0100000002144b0ef9f853c33a3d8c309fed08815d85a2e6b793010000000075",
           "elProof":[
              {
                 "branchType":2,
                 "proofSequence":{
                    "CMerkleBranchBase":2,
                    "nIndex":3,
                    "nSize":6,
                    "branch":[
                       "0x0c01c26f28a6f71f5e2fd2acc2adb8e300d26bc1ea5f1657a758ef3349a930f1",
                       "0xbfef634a235a2ee548e08266785318cae1fb9557bd2814ca030b19587f6e48b9"
                    ],
                    "txHeight":5
                 }
              }
           ]
        }
     ]
  },
  "transfers":[
     {
        "version":1,
        "flags":65,
        "crosssystem":true,
        "feecurrencyid":"0x67460c2f56774ed27eeb8685f29f6cec0b090b00",
        "fees":120000,
        "destination":{
           "destinationaddress":"0x37245c7f865b5c1b6f1db81523ccf3626df625bc",
           "destinationtype":9
        },
        "secondreserveid":"0x67460c2f56774ed27eeb8685f29f6cec0b090b00",
        "currencyvalue":{
           "currency":"0xf0a1263056c30e221f0f851c36b767fff2544f7f",
           "amount":5000000000
        },
        "destcurrencyid":"0x67460c2f56774ed27eeb8685f29f6cec0b090b00",
        "destsystemid":"0x67460c2f56774ed27eeb8685f29f6cec0b090b00"
     }
  ]
}

const transaction2 = {
  "height":275,
  "txid":"0xcb91351c5a7254cdb25e0ff03d13ce3a7f00cde516bf4a67c54c5a3d8f981272",
  "txoutnum":1,
  "exportinfo":{
     "version":1,
     "flags":2,
     "sourcesystemid":"0x67460c2f56774ed27eeb8685f29f6cec0b090b00",
     "hashtransfers":"0x268c7a46803968af809c974cd459f83b3abd1fa503241e4159a2d50e7b3f5c9e",
     "destinationsystemid":"0xa6ef9ea235635e328124ff3429db9f9e91b64e2d",
     "destinationcurrencyid":"0x67460c2f56774ed27eeb8685f29f6cec0b090b00",
     "sourceheightstart":1,
     "sourceheightend":2,
     "numinputs":1,
     "totalamounts":[
        {
           "currency":"0xb26820ee0c9b1276aac834cf457026a575dfce84",
           "amount":0
        },
        {
           "currency":"0x67460c2f56774ed27eeb8685f29f6cec0b090b00",
           "amount":140000
        }
     ],
     "totalfees":[
        {
           "currency":"0x67460c2f56774ed27eeb8685f29f6cec0b090b00",
           "amount":140000
        }
     ],
     "totalburned":[
        {
           "currency":"0x0000000000000000000000000000000000000000",
           "amount":0
        }
     ],
     "rewardaddress":{
        "destinationtype":9,
        "destinationaddress":"0xb26820ee0c9b1276aac834cf457026a575dfce84"
     },
     "firstinput":1
  },
  "partialtransactionproof":{
     "version":1,
     "typeC":2,
     "txproof":[
        {
           "branchType":2,
           "proofSequence":{
              "CMerkleBranchBase":2,
              "nIndex":1,
              "nSize":2,
              "branch":[
                 "0x1a213fcc211b7fac3dcfcf8663252b25c757c88ef78aee90bada952a632ede9a"
              ],
              "txHeight":1
           }
        },
        {
           "branchType":2,
           "proofSequence":{
              "CMerkleBranchBase":2,
              "nIndex":0,
              "nSize":2,
              "branch":[
                 "0x9c7b3242495fe17fe440212a52c371c4f83e4b37131099a1d879c8ad3f000000"
              ],
              "txHeight":0
           }
        },
        {
           "branchType":3,
           "proofSequence":{
              "CMerkleBranchBase":3,
              "nIndex":138,
              "nSize":280,
              "branch":[
                 "0xbd20840100000000000000000000000000000000000000000000000000000000",
                 "0x2af58c70a98a09e1b6755f9135696b0abc3064d1d333fd4a23f3dc12095ab0ac",
                 "0x60100c0300000000000000000000000000000000000000000000000000000000",
                 "0xc5e76e1df15a8085e36290c68e686109982d8a2a26d5b760eb93a9e6360e424e",
                 "0x1f3fe80500000000000000000000000000000000000000000000000000000000",
                 "0x577a8b4c9f9ae4c8f60b8908a7079db851425703839bb8fd94a61980b25a2440",
                 "0xe233290c00000000000000000000000000000000000000000000000000000000",
                 "0xcea7665610bded396a6102a9272ca5f584de17ae6b839293b5f8c8f7311e21bb",
                 "0x3209bb7600000000000000000000000000000000000000000000000000000000"
              ],
              "txHeight":275
           }
        }
     ],
     "components":[
        {
           "elType":1,
           "elIdx":0,
           "elVchObj":"0xcb91351c5a7254cdb25e0ff03d13ce3a7f00cde516bf4a67c54c5a3d8f981272010400000085202f890200000002000000000000000000000000000000270100000000000000000000",
           "elProof":[
              {
                 "branchType":2,
                 "proofSequence":{
                    "CMerkleBranchBase":2,
                    "nIndex":0,
                    "nSize":7,
                    "branch":[
                       "0xcde9b7e696201de50bdd30fa64a00324c153d5cde3c300599b80e93d7a461992",
                       "0x0a7c66c40590134b944bbbb9980363129e59b6932bc3df54f7819d45cd185d3d",
                       "0xf26eac29c71f45ab2c24d9d9244732ce8f65e3aae7a84f9f2ae649554493332d",
                       "0x6e616497698f0399da8f0163581483775d723964080d76c78983c4956599c71a"
                    ],
                    "txHeight":0
                 }
              }
           ]
        },
        {
           "elType":2,
           "elIdx":0,
           "elVchObj":"0x03aa3130cec1317ccc387a4c4a3373dbff32e21fb7d18e2d293ab10b94ecb32400000000ffffffff",
           "elProof":[
              {
                 "branchType":2,
                 "proofSequence":{
                    "CMerkleBranchBase":2,
                    "nIndex":1,
                    "nSize":7,
                    "branch":[
                       "0xe6d5712384fe4537c1b2ccabc962db5e1b71c009ffb9126737b73e90ff0157df",
                       "0x0a7c66c40590134b944bbbb9980363129e59b6932bc3df54f7819d45cd185d3d",
                       "0xf26eac29c71f45ab2c24d9d9244732ce8f65e3aae7a84f9f2ae649554493332d",
                       "0x6e616497698f0399da8f0163581483775d723964080d76c78983c4956599c71a"
                    ],
                    "txHeight":1
                 }
              }
           ]
        },
        {
           "elType":4,
           "elIdx":1,
           "elVchObj":"0x0000000000000000f91a04030001011452047d0db35c330271aae70bedce996b5239ca5ccc4cda04030c01011452047d0db35c330271aae70bedce996b5239ca5c4cbe01008000a6ef9ea235635e328124ff3429db9f9e91b64e2db85299896cc3a62f423ee39b0aed1a0ebaa76b06061a3edea84751891e52115567460c2f56774ed27eeb8685f29f6cec0b090b0067460c2f56774ed27eeb8685f29f6cec0b090b0081088112010000000167460c2f56774ed27eeb8685f29f6cec0b090b00e022020000000000000167460c2f56774ed27eeb8685f29f6cec0b090b00e022020000000000021422faeb432cd2d9876c46e01cc407e38bfde14ad4010000000075",
           "elProof":[
              {
                 "branchType":2,
                 "proofSequence":{
                    "CMerkleBranchBase":2,
                    "nIndex":1,
                    "nSize":7,
                    "branch":[
                       "0xc6af4671b3c2b489a73a2d5162895d848debf61376419ba20a16ec80f1190876"
                    ],
                    "txHeight":6
                 }
              }
           ]
        }
     ]
  },
  "transfers":[
     {
        "version":1,
        "flags":8257,
        "crosssystem":true,
        "feecurrencyid":"0x67460c2f56774ed27eeb8685f29f6cec0b090b00",
        "fees":140000,
        "destination":{
           "currency":{
              "version":1,
              "options":96,
              "name":"id1",
              "currencyid":"iKjrTCwoPFRk44fAi2nYNbPG16ZUQjv1NB",
              "parent":"iJhCezBExJHvtyH3fGhNnt2NhU4Ztkf2yq",
              "systemid":"iJhCezBExJHvtyH3fGhNnt2NhU4Ztkf2yq",
              "notarizationprotocol":1,
              "proofprotocol":1,
              "launchsystemid":"iJhCezBExJHvtyH3fGhNnt2NhU4Ztkf2yq",
              "startblock":282,
              "endblock":0,
              "preallocations":[
                 {
                    "iKjrTCwoPFRk44fAi2nYNbPG16ZUQjv1NB":40000
                 }
              ],
              "idregistrationfees":100,
              "idreferrallevels":3,
              "idimportfees":0.02
           },
           "serializeddata":"0100000060000000a6ef9ea235635e328124ff3429db9f9e91b64e2d03696431a6ef9ea235635e328124ff3429db9f9e91b64e2da6ef9ea235635e328124ff3429db9f9e91b64e2d01000000010000000000811a00000000000000000001b26820ee0c9b1276aac834cf457026a575dfce8400409452a303000000000000000000000000000000000000000000000000a49faec70003f98800",
           "destinationaddress":"0x0100000060000000a6ef9ea235635e328124ff3429db9f9e91b64e2d03696431a6ef9ea235635e328124ff3429db9f9e91b64e2da6ef9ea235635e328124ff3429db9f9e91b64e2d01000000010000000000811a00000000000000000001b26820ee0c9b1276aac834cf457026a575dfce8400409452a303000000000000000000000000000000000000000000000000a49faec70003f98800",
           "destinationtype":6
        },
        "secondreserveid":"0x67460c2f56774ed27eeb8685f29f6cec0b090b00",
        "currencyvalue":{
           "currency":"0xb26820ee0c9b1276aac834cf457026a575dfce84",
           "amount":0
        },
        "destcurrencyid":"0x67460c2f56774ed27eeb8685f29f6cec0b090b00",
        "destsystemid":"0x67460c2f56774ed27eeb8685f29f6cec0b090b00"
     }
  ]
};

const transfers1 = [
  {
     "version":1,
     "flags":65,
     "crosssystem":true,
     "feecurrencyid":"0x67460c2f56774ed27eeb8685f29f6cec0b090b00",
     "fees":120000,
     "destination":{
        "destinationaddress":"0x37245c7f865b5c1b6f1db81523ccf3626df625bc",
        "destinationtype":9
     },
     "secondreserveid":"0x67460c2f56774ed27eeb8685f29f6cec0b090b00",
     "currencyvalue":{
        "currency":"0xf0a1263056c30e221f0f851c36b767fff2544f7f",
        "amount":5000000000
     },
     "destcurrencyid":"0x67460c2f56774ed27eeb8685f29f6cec0b090b00",
     "destsystemid":"0x67460c2f56774ed27eeb8685f29f6cec0b090b00"
  }
];

const transfers2 = [
  {
     "version":1,
     "flags":8257,
     "crosssystem":true,
     "feecurrencyid":"0x67460c2f56774ed27eeb8685f29f6cec0b090b00",
     "fees":140000,
     "destination":{
        "destinationaddress":"0x0100000060000000a6ef9ea235635e328124ff3429db9f9e91b64e2d03696431a6ef9ea235635e328124ff3429db9f9e91b64e2da6ef9ea235635e328124ff3429db9f9e91b64e2d01000000010000000000811a00000000000000000001b26820ee0c9b1276aac834cf457026a575dfce8400409452a303000000000000000000000000000000000000000000000000a49faec70003f98800",
        "destinationtype":6
     },
     "secondreserveid":"0x67460c2f56774ed27eeb8685f29f6cec0b090b00",
     "currencyvalue":{
        "currency":"0xb26820ee0c9b1276aac834cf457026a575dfce84",
        "amount":0
     },
     "destcurrencyid":"0x67460c2f56774ed27eeb8685f29f6cec0b090b00",
     "destsystemid":"0x67460c2f56774ed27eeb8685f29f6cec0b090b00"
  }
];
const  VALID = 1
const  CONVERT = 2
const  PRECONVERT = 4
const  CROSS_SYSTEM = 0x40                // if this is set there is a systemID serialized and deserialized as well for destination
const  IMPORT_TO_SOURCE = 0x200           // set when the source currency not destination is the import currency
const  RESERVE_TO_RESERVE = 0x400         // for arbitrage or transient conversion 2 stage solving (2nd from new fractional to reserves)
const  ETH_FEE_SATS = 300000; //0.003 ETH FEE
const  ETH_FEE = "0.003"; //0.003 ETH FEE

  const testfunc1 = async () =>{
      try{

 //   const revv = await verusBridge.methods._createImports(transaction1).call(); //send({from: account.address, gas: maxGas});
   // const revv2 = await verusBridge.methods._createImports(transaction2).call(); //send({from: account.address, gas: maxGas});
   const revv2 = await verusProof.methods.checkTransfers(transaction1).call(); //send({from: account.address, gas: maxGas});
   const revv3 = await verusProof.methods.checkTransfers(transaction2).call(); //send({from: account.address, gas: maxGas});
    const revv4 = await verusProof.methods.proveTransaction(transaction2).call(); //send({from: account.address, gas: maxGas});
    const revv5 = await verusProof.methods.hashTransfers(transfers1).call(); //send({from: account.address, gas: maxGas});
    const revv6 = await verusProof.methods.hashTransfers(transfers2).call(); //send({from: account.address, gas: maxGas});
    

//    console.log("\n",revv);
    console.log("\ncheckTransfers1: ",revv2);
    console.log("\ncheckTransfers2: ",revv3);
    console.log("\nproveTransaction: ",revv4);
    console.log("\nhash transfers1: ",revv5);
    console.log("\nhash transfers2: ",revv6);
      }catch(e){
        console.log(e);

      }
    process.exit(0);
    }
    
    testfunc1();


const Web3 = require('web3');

const confFile = require('../confFile.js')
var constants = require('../constants');


const ticker = process.argv.indexOf('-production') > -1 ? "VRSC" : "VRSCTEST";

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

const verusBridgeAbi = require('../abi/VerusBridgeMaster.json');
const verusBridge = new web3.eth.Contract(verusBridgeAbi, "0xed3C74240b78D7e66027Dc9bd0cC1509cfd8A4C0");

const verusProofAbi = require('../abi/VerusProof.json');
const verusProof = new web3.eth.Contract(verusProofAbi, "0x93c27ec421a136227684F4B6CC7B716e4CE033Ef");

const verusSerializerAbi = require('../abi/VerusSerializer.json');
const verusSerilaizer = new web3.eth.Contract(verusSerializerAbi, "0x4C0BeE6842c50e33746819122bd4bF3264381E45");

const tokenManagerAbi = require('../abi/TokenManager.json');
const tokenManager = new web3.eth.Contract(tokenManagerAbi, "0x1c7bEF835169E53322712b952a83aC483e94cC19");

let account = web3.eth.accounts.privateKeyToAccount(settings.privatekey);
web3.eth.accounts.wallet.add(account);
web3.eth.handleRevert = true
const maxGas = 6000000;


const transaction1 = [
    {
       "height":454,
       "txid":"0x70cc64019d18668825bea5d325b14c617e36b9fabcadf05f822768d77fbf35f4",
       "txoutnum":1,
       "exportinfo":{
          "version":1,
          "flags":2,
          "sourcesystemid":"0x67460c2f56774ed27eeb8685f29f6cec0b090b00",
          "hashtransfers":"0x42a5f358f577090c108a03477ceb5f5f876188986f0782777fe1ebc766e4c009",
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
                      "0x05fb0289486153528123ec10f02f6e0343610760454b9e37dd736bf598b63b6f"
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
                      "0x254e2244e3855511b55ea6b42d5eecda82269755da326286785d970832000000"
                   ],
                   "txHeight":0
                }
             },
             {
                "branchType":3,
                "proofSequence":{
                   "CMerkleBranchBase":3,
                   "nIndex":680,
                   "nSize":460,
                   "branch":[
                      "0x53bd450100000000000000000000000000000000000000000000000000000000",
                      "0xa78841b8cb42a4c02a2d4e1aa6efb338e775ad3f5d19cbd97e93b52f42931251",
                      "0x99268e0200000000000000000000000000000000000000000000000000000000",
                      "0xa06244372beb0ebc0ad8932192cc945dbfb06caffe188c81798d21797b118b00",
                      "0x49fc200500000000000000000000000000000000000000000000000000000000",
                      "0xddd184353c76edd6cedbdffd40530a2ff973f0e84c75d6a7e3ab51726d68c921",
                      "0xb491730900000000000000000000000000000000000000000000000000000000",
                      "0x9a1eed8d10a7379a0de01dd6929ef6056b8cfc8bfca7d3b1c5e99e786506ece8",
                      "0x4345394100000000000000000000000000000000000000000000000000000000",
                      "0xf145953d912ef92c1ad0d40add8fd79119d1d8ae383b46e0d744ddd8ae94d6df",
                      "0x2ee82bc900000000000000000000000000000000000000000000000000000000",
                      "0x106eb00f6ba26ecfac0e5dd6e7866382fe092a678ea38b7a8f281c4a176a2eb5",
                      "0xc894f3ce00000000000000000000000000000000000000000000000000000000"
                   ],
                   "txHeight":454
                }
             }
          ],
          "components":[
             {
                "elType":1,
                "elIdx":0,
                "elVchObj":"0x70cc64019d18668825bea5d325b14c617e36b9fabcadf05f822768d77fbf35f4010400000085202f890200000002000000000000000000000000000000da0100000000000000000000",
                "elProof":[
                   {
                      "branchType":2,
                      "proofSequence":{
                         "CMerkleBranchBase":2,
                         "nIndex":0,
                         "nSize":7,
                         "branch":[
                            "0x626d4da602acadba47ed7134f88fadce2cbf5f12cc2ed0bdef72a9b8f5421257",
                            "0x1ffd19bba524ab68f89e6e63b24c5c6d8b7985f6f4727a17a2f4bdb12e6aa3eb",
                            "0xd9caab60cafceaab073a621f979db47193c820f51de80be42b788361863eadbf",
                            "0x45869d622c48974c61630811b2a65e47e37d90f869095edd0cff929d44e6544f"
                         ],
                         "txHeight":0
                      }
                   }
                ]
             },
             {
                "elType":2,
                "elIdx":0,
                "elVchObj":"0x9971572dee40843709147a205c53ac78176a0cf28cf62d956e800f146524f84f04000000ffffffff",
                "elProof":[
                   {
                      "branchType":2,
                      "proofSequence":{
                         "CMerkleBranchBase":2,
                         "nIndex":1,
                         "nSize":7,
                         "branch":[
                            "0x2d4e9ca400c18ab859530e6503ff7660c9272cbd2fe47923fcb9180969f9da47",
                            "0x1ffd19bba524ab68f89e6e63b24c5c6d8b7985f6f4727a17a2f4bdb12e6aa3eb",
                            "0xd9caab60cafceaab073a621f979db47193c820f51de80be42b788361863eadbf",
                            "0x45869d622c48974c61630811b2a65e47e37d90f869095edd0cff929d44e6544f"
                         ],
                         "txHeight":1
                      }
                   }
                ]
             },
             {
                "elType":4,
                "elIdx":1,
                "elVchObj":"0x0000000000000000f91a04030001011452047d0db35c330271aae70bedce996b5239ca5ccc4cda04030c01011452047d0db35c330271aae70bedce996b5239ca5c4cbe01008000a6ef9ea235635e328124ff3429db9f9e91b64e2d42a5f358f577090c108a03477ceb5f5f876188986f0782777fe1ebc766e4c00967460c2f56774ed27eeb8685f29f6cec0b090b0067460c2f56774ed27eeb8685f29f6cec0b090b00810e8245010000000167460c2f56774ed27eeb8685f29f6cec0b090b00e022020000000000000167460c2f56774ed27eeb8685f29f6cec0b090b00e02202000000000002146b7aa8d32617d1bf803efad499ba6e8294bde4a2010000000075",
                "elProof":[
                   {
                      "branchType":2,
                      "proofSequence":{
                         "CMerkleBranchBase":2,
                         "nIndex":1,
                         "nSize":7,
                         "branch":[
                            "0x018d9231716208f719610eb36cebc4f57ce4cee9a26ff21039bd9aa56632f066"
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
                   "startblock":367,
                   "endblock":0,
                   "preallocations":[
                      {
                         "iKjrTCwoPFRk44fAi2nYNbPG16ZUQjv1NB":40000
                      }
                   ],
                   "idregistrationfees":100,
                   "idreferrallevels":3,
                   "idimportfees":1
                },
                "serializeddata":"0100000060000000a6ef9ea235635e328124ff3429db9f9e91b64e2d03696431a6ef9ea235635e328124ff3429db9f9e91b64e2da6ef9ea235635e328124ff3429db9f9e91b64e2d01000000010000000000816f00000000000000000001b26820ee0c9b1276aac834cf457026a575dfce8400409452a303000000000000000000000000000000000000000000000000a49faec70003aed6c100",
                "destinationaddress":"0x0100000060000000a6ef9ea235635e328124ff3429db9f9e91b64e2d03696431a6ef9ea235635e328124ff3429db9f9e91b64e2da6ef9ea235635e328124ff3429db9f9e91b64e2d01000000010000000000816f00000000000000000001b26820ee0c9b1276aac834cf457026a575dfce8400409452a303000000000000000000000000000000000000000000000000a49faec70003aed6c100",
                "destinationtype":6
             },
             "secondreserveid":"0x0000000000000000000000000000000000000000",
             "currencyvalue":{
                "currency":"0xb26820ee0c9b1276aac834cf457026a575dfce84",
                "amount":0
             },
             "destcurrencyid":"0x67460c2f56774ed27eeb8685f29f6cec0b090b00",
             "destsystemid":"0x67460c2f56774ed27eeb8685f29f6cec0b090b00"
          }
       ],
       "serializedTransfers":"0x01b26820ee0c9b1276aac834cf457026a575dfce8400bf4167460c2f56774ed27eeb8685f29f6cec0b090b0087c460069a0100000060000000a6ef9ea235635e328124ff3429db9f9e91b64e2d03696431a6ef9ea235635e328124ff3429db9f9e91b64e2da6ef9ea235635e328124ff3429db9f9e91b64e2d01000000010000000000816f00000000000000000001b26820ee0c9b1276aac834cf457026a575dfce8400409452a303000000000000000000000000000000000000000000000000a49faec70003aed6c10067460c2f56774ed27eeb8685f29f6cec0b090b0067460c2f56774ed27eeb8685f29f6cec0b090b00"
    }
 ]


const transfers1 = [{
    "version": 1,
    "flags": 65,
    "crosssystem": true,
    "feecurrencyid": "0x67460c2f56774ed27eeb8685f29f6cec0b090b00",
    "fees": 120000,
    "destination": {
        "destinationaddress": "0x37245c7f865b5c1b6f1db81523ccf3626df625bc",
        "destinationtype": 9
    },
    "secondreserveid": "0x67460c2f56774ed27eeb8685f29f6cec0b090b00",
    "currencyvalue": {
        "currency": "0xf0a1263056c30e221f0f851c36b767fff2544f7f",
        "amount": 5000000000
    },
    "destcurrencyid": "0x67460c2f56774ed27eeb8685f29f6cec0b090b00",
    "destsystemid": "0x67460c2f56774ed27eeb8685f29f6cec0b090b00"
}];

const testserialized = "0x01b26820ee0c9b1276aac834cf457026a575dfce8400bf4167460c2f56774ed27eeb8685f29f6cec0b090b0087c460069a0100000060000000a6ef9ea235635e328124ff3429db9f9e91b64e2d03696431a6ef9ea235635e328124ff3429db9f9e91b64e2da6ef9ea235635e328124ff3429db9f9e91b64e2d01000000010000000000816f00000000000000000001b26820ee0c9b1276aac834cf457026a575dfce8400409452a303000000000000000000000000000000000000000000000000a49faec70003aed6c10067460c2f56774ed27eeb8685f29f6cec0b090b0067460c2f56774ed27eeb8685f29f6cec0b090b00"




const testfunc1 = async() => {
    try {

        //const submit = await verusBridge.methods.submitImports(transaction1).send({ from: account.address, gas: maxGas });
        const revv2 = await verusProof.methods.proveImports(transaction1[0]).call(); //send({from: account.address, gas: maxGas});
        const revv3 = await verusProof.methods.checkTransfers(transaction1[0]).call(); //send({from: account.address, gas: maxGas});
        const revv4 = await verusProof.methods.proveTransaction(transaction1[0]).call(); //send({from: account.address, gas: maxGas});
        const serializedtxs1 = await verusSerilaizer.methods.deserializeTransfers(transaction1[0].serializedTransfers).call();

        const revv5 = await tokenManager.methods.processTransactions(serializedtxs1).call();

        console.log("\nproveImports: ", revv2);
        console.log("\ncheckTransfers: ", revv3);
        console.log("\nproveTransaction: ", revv4);
        console.log("\nserializedtxs: ", revv5);
        // console.log("\nprocessTransactions: ", revv5);

    } catch (e) {
        console.log(e);
    }
    process.exit(0);
}


testfunc1();
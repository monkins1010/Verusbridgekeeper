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
const verusBridge = new web3.eth.Contract(verusBridgeAbi, "0xC904d3906Aff27CFC44b85aE54Dacce841284BFc");

const verusProofAbi = require('../abi/VerusProof.json');
const verusProof = new web3.eth.Contract(verusProofAbi, "0x8BD202233a07038ECeEF539A296816EE20C8449D");

const verusSerializerAbi = require('../abi/VerusSerializer.json');
const verusSerilaizer = new web3.eth.Contract(verusSerializerAbi, "0x8eB49AB6FC8C640Bd958fd80e041Bd7bb3Fbae01");

const tokenManagerAbi = require('../abi/TokenManager.json');
const tokenManager = new web3.eth.Contract(tokenManagerAbi, "0x7d8D9B26A00F4793408c101e9000FD064B9cC004");

let account = web3.eth.accounts.privateKeyToAccount(settings.privatekey);
web3.eth.accounts.wallet.add(account);
web3.eth.handleRevert = true
const maxGas = 6000000;


const transaction1 = [{
        "height": 8100,
        "txid": "0xe4bb3eacb9ac8d38c5c68333b246bcf068aa1a0a62be697c720b782aca3e166f",
        "txoutnum": 1,
        "exportinfo": {
            "version": 1,
            "flags": 2,
            "sourcesystemid": "0x67460c2f56774ed27eeb8685f29f6cec0b090b00",
            "hashtransfers": "0xc4abd04dc36a004a649428350fcb0eb5d289ea6f61409d7f5619cdf259e5bdae",
            "destinationsystemid": "0xa6ef9ea235635e328124ff3429db9f9e91b64e2d",
            "destinationcurrencyid": "0x67460c2f56774ed27eeb8685f29f6cec0b090b00",
            "sourceheightstart": 1,
            "sourceheightend": 2,
            "numinputs": 3,
            "totalamounts": [{
                    "currency": "0x67460c2f56774ed27eeb8685f29f6cec0b090b00",
                    "amount": 20960000
                },
                {
                    "currency": "0xf0a1263056c30e221f0f851c36b767fff2544f7f",
                    "amount": 3300000000
                },
                {
                    "currency": "0xa6ef9ea235635e328124ff3429db9f9e91b64e2d",
                    "amount": 2200000000
                }
            ],
            "totalfees": [{
                "currency": "0x67460c2f56774ed27eeb8685f29f6cec0b090b00",
                "amount": 960000
            }],
            "totalburned": [{
                "currency": "0x0000000000000000000000000000000000000000",
                "amount": 0
            }],
            "rewardaddress": {
                "destinationtype": 9,
                "destinationaddress": "0xb26820ee0c9b1276aac834cf457026a575dfce84"
            },
            "firstinput": 1
        },
        "partialtransactionproof": {
            "version": 1,
            "typeC": 2,
            "txproof": [{
                    "branchType": 2,
                    "proofSequence": {
                        "CMerkleBranchBase": 2,
                        "nIndex": 1,
                        "nSize": 2,
                        "branch": [
                            "0x1d1fbdff6e4f00d53f3bf479d154aab05524260f0a71703cfd63216de3fd1f76"
                        ],
                        "txHeight": 1
                    }
                },
                {
                    "branchType": 2,
                    "proofSequence": {
                        "CMerkleBranchBase": 2,
                        "nIndex": 0,
                        "nSize": 2,
                        "branch": [
                            "0xb2f18e423768b377d0cb75d9cc078bc70546790a388f5fa0a19780f30b000000"
                        ],
                        "txHeight": 0
                    }
                },
                {
                    "branchType": 3,
                    "proofSequence": {
                        "CMerkleBranchBase": 3,
                        "nIndex": 44730400,
                        "nSize": 13253,
                        "branch": [
                            "0x4abb511300000000000000000000000000000000000000000000000000000000",
                            "0xca839cd42efe4011a70429ba8f34051735ca1c72e835f2c5909db0f4e9d32873",
                            "0x039a432600000000000000000000000000000000000000000000000000000000",
                            "0x1c11d19805f57e8548d92722aad9ce0787262f9f397dce6dc41d8b6feae4ac4b",
                            "0xf51e1d490000000000000000000000005668f1abd10300000000000000000000",
                            "0x4ab7ca13c536d9ddfc95774c91307b6e2f48ef09dbe5e2967c332102ef043348",
                            "0xa19827a80000000000000000000000004e735dbc7f0e00000000000000000000",
                            "0x8e4f317c306c66cd63247184640dab7a14d9fab44c0f2683caf57d5b196455af",
                            "0x79b68f3f0100000000000000000000001284a6b8ee1900000000000000000000",
                            "0x61275e870e3965eb901f2acd4db2a9c8a938309278381916f5d03caf82af75c0",
                            "0xa8a750c302000000000000000000000060fd4a9cd54c00000000000000000000",
                            "0x0797898d499d602547538a20f8bec961a1a5690a7aac822e0196262e833fdfd5",
                            "0x1d6ab8f4040000000000000000000000c18f8ab4777900000000000000000000",
                            "0xbf2954700a603a5a0f65c5385f3e358f6c43042b1c365ac75a6943f5118f32a0",
                            "0xf8fd86230800000000000000000000003fff5f1db0d300000000000000000000",
                            "0x30b3148c40647e840ea84564289972548e306735f65ed4452db0056b48031be3",
                            "0xa5b1d406120000000000000000000000c2257a7f67aa01000000000000000000",
                            "0x4d24359ae82cc60ef5facd2986893ec7f33e16a6a5916ad1247e40250337832d",
                            "0x21f8c0d7250000000000000000000000ea970670c1d903000000000000000000",
                            "0x72ecb3dca55a6e1fe6115ee1ed7dc4df598a438fe6e69d3d82f0f62aa6a2590f",
                            "0xf54f0f1b4b000000000000000000000099e9bac745be07000000000000000000",
                            "0xfdfa1eaf05c2768d3920d2fe473cc639aa72e1ee54b8184b03ee4532b1317837",
                            "0xf7d44e2a9500000000000000000000006e5b892c38450c000000000000000000",
                            "0xa0b597435becf24c7fb98fe5af65c49d3694865f750c77ac0e009284739d7e11",
                            "0x592ebbf931010000000000000000000072a82b684dd15b000000000000000000",
                            "0x9ac0da1eccd8bf1fcc76bc78e540a366bf5d6bf7fa75bf91acad46afcf6ac1e8",
                            "0x88560e2e3f02000000000000000000003bc4fe266e96fa000000000000000000",
                            "0x802d01d5bab790146c74d691c2aa667ba3a420c1cf0a3d9e2625474e00f4af76",
                            "0xe97009a24003000000000000000000007fbf4b2b014e2f010000000000000000",
                            "0x56b5b7001dee580734f8204d58f8302bc271d8bb9f283320f18b8a28f4ccbc23",
                            "0xb233a46f76030000000000000000000051e42656884e3e010000000000000000",
                            "0x76c46a47256dc4c1d8c79a580ca1a84f38bebc95152c235965d671933cb295b5",
                            "0x4d7618b8840300000000000000000000a9f0e08eac8e42010000000000000000"
                        ],
                        "txHeight": 8100
                    }
                }
            ],
            "components": [{
                    "elType": 1,
                    "elIdx": 0,
                    "elVchObj": "0xe4bb3eacb9ac8d38c5c68333b246bcf068aa1a0a62be697c720b782aca3e166f010400000085202f890400000002000000000000000000000000000000b81f00000000000000000000",
                    "elProof": [{
                        "branchType": 2,
                        "proofSequence": {
                            "CMerkleBranchBase": 2,
                            "nIndex": 0,
                            "nSize": 11,
                            "branch": [
                                "0x4fa1a2cbfc61857332d816c2c12627dc9da9c0f5024aa12a9105f24a91c71e1d",
                                "0xc00c1936ceaf060914378aac0365fae52f889a06b6f68022a0fea97f96569b69",
                                "0x7f4ba5821ce233b0f3f25e4aa2ed711214bdb33659a1a72c605b2b4cdc785440",
                                "0x6b2b4cc79abf6e7637daf9c5b6b76235d5cf70a84534536b813fb8dbad4af70d",
                                "0xeb5ae57c355c45e8ca62139cef1ead1f91a52c88a37fc4799eab4cc8c9c9d9da"
                            ],
                            "txHeight": 0
                        }
                    }]
                },
                {
                    "elType": 2,
                    "elIdx": 0,
                    "elVchObj": "0xc32af79e679917d151e3e266f153ee85c712ff6d48c4fa6a8a29d878bfbd921904000000ffffffff",
                    "elProof": [{
                        "branchType": 2,
                        "proofSequence": {
                            "CMerkleBranchBase": 2,
                            "nIndex": 1,
                            "nSize": 11,
                            "branch": [
                                "0x81b81e37861aae872bedf276c1ab5f9fed36dd8e86f7ef57f1b7dd1ec56c034c",
                                "0xc00c1936ceaf060914378aac0365fae52f889a06b6f68022a0fea97f96569b69",
                                "0x7f4ba5821ce233b0f3f25e4aa2ed711214bdb33659a1a72c605b2b4cdc785440",
                                "0x6b2b4cc79abf6e7637daf9c5b6b76235d5cf70a84534536b813fb8dbad4af70d",
                                "0xeb5ae57c355c45e8ca62139cef1ead1f91a52c88a37fc4799eab4cc8c9c9d9da"
                            ],
                            "txHeight": 1
                        }
                    }]
                },
                {
                    "elType": 4,
                    "elIdx": 1,
                    "elVchObj": "0x0000000000000000fd4f011a04030001011452047d0db35c330271aae70bedce996b5239ca5ccc4d2f0104030c01011452047d0db35c330271aae70bedce996b5239ca5c4d120101008000a6ef9ea235635e328124ff3429db9f9e91b64e2dc4abd04dc36a004a649428350fcb0eb5d289ea6f61409d7f5619cdf259e5bdae67460c2f56774ed27eeb8685f29f6cec0b090b0067460c2f56774ed27eeb8685f29f6cec0b090b00bd57be23030000000367460c2f56774ed27eeb8685f29f6cec0b090b0000d33f0100000000a6ef9ea235635e328124ff3429db9f9e91b64e2d0056218300000000f0a1263056c30e221f0f851c36b767fff2544f7f0001b2c400000000000267460c2f56774ed27eeb8685f29f6cec0b090b0000d33f0100000000f0a1263056c30e221f0f851c36b767fff2544f7f0001b2c40000000002146cbfbcba970cc9b069625ce6bee245b6f0d3f9be010000000075",
                    "elProof": [{
                        "branchType": 2,
                        "proofSequence": {
                            "CMerkleBranchBase": 2,
                            "nIndex": 1,
                            "nSize": 11,
                            "branch": [
                                "0x25968352e37e943e6ecd43d45d85798e307d31ff718b4934d49960eb5d893968"
                            ],
                            "txHeight": 10
                        }
                    }]
                }
            ]
        },
        "transfers": [{
                "version": 1,
                "flags": 65,
                "crosssystem": true,
                "feecurrencyid": "0x67460c2f56774ed27eeb8685f29f6cec0b090b00",
                "fees": 320000,
                "destination": {
                    "destinationaddress": "0x8c7d6364f1bf43248f2b26060dbd29da01d7dd31",
                    "destinationtype": 9
                },
                "secondreserveid": "0x0000000000000000000000000000000000000000",
                "currencyvalue": {
                    "currency": "0x67460c2f56774ed27eeb8685f29f6cec0b090b00",
                    "amount": 20000000
                },
                "destcurrencyid": "0x67460c2f56774ed27eeb8685f29f6cec0b090b00",
                "destsystemid": "0x67460c2f56774ed27eeb8685f29f6cec0b090b00"
            },
            {
                "version": 1,
                "flags": 65,
                "crosssystem": true,
                "feecurrencyid": "0x67460c2f56774ed27eeb8685f29f6cec0b090b00",
                "fees": 320000,
                "destination": {
                    "destinationaddress": "0x8c7d6364f1bf43248f2b26060dbd29da01d7dd31",
                    "destinationtype": 9
                },
                "secondreserveid": "0x0000000000000000000000000000000000000000",
                "currencyvalue": {
                    "currency": "0xf0a1263056c30e221f0f851c36b767fff2544f7f",
                    "amount": 3300000000
                },
                "destcurrencyid": "0x67460c2f56774ed27eeb8685f29f6cec0b090b00",
                "destsystemid": "0x67460c2f56774ed27eeb8685f29f6cec0b090b00"
            },
            {
                "version": 1,
                "flags": 65,
                "crosssystem": true,
                "feecurrencyid": "0x67460c2f56774ed27eeb8685f29f6cec0b090b00",
                "fees": 320000,
                "destination": {
                    "destinationaddress": "0x8c7d6364f1bf43248f2b26060dbd29da01d7dd31",
                    "destinationtype": 9
                },
                "secondreserveid": "0x0000000000000000000000000000000000000000",
                "currencyvalue": {
                    "currency": "0xa6ef9ea235635e328124ff3429db9f9e91b64e2d",
                    "amount": 2200000000
                },
                "destcurrencyid": "0x67460c2f56774ed27eeb8685f29f6cec0b090b00",
                "destsystemid": "0x67460c2f56774ed27eeb8685f29f6cec0b090b00"
            }
        ],
        "serializedTransfers": "0x0167460c2f56774ed27eeb8685f29f6cec0b090b0088c3d9004167460c2f56774ed27eeb8685f29f6cec0b090b0092c30009148c7d6364f1bf43248f2b26060dbd29da01d7dd3167460c2f56774ed27eeb8685f29f6cec0b090b0067460c2f56774ed27eeb8685f29f6cec0b090b0001f0a1263056c30e221f0f851c36b767fff2544f7f8ba4c781004167460c2f56774ed27eeb8685f29f6cec0b090b0092c30009148c7d6364f1bf43248f2b26060dbd29da01d7dd3167460c2f56774ed27eeb8685f29f6cec0b090b0067460c2f56774ed27eeb8685f29f6cec0b090b0001a6ef9ea235635e328124ff3429db9f9e91b64e2d879884ab004167460c2f56774ed27eeb8685f29f6cec0b090b0092c30009148c7d6364f1bf43248f2b26060dbd29da01d7dd3167460c2f56774ed27eeb8685f29f6cec0b090b0067460c2f56774ed27eeb8685f29f6cec0b090b00"
    },
    {
        "height": 13185,
        "txid": "0xde0e94f97d62ab5f6858c705a6675c311e8fc69299fe531c4570ab89143ae4b9",
        "txoutnum": 0,
        "exportinfo": {
            "version": 1,
            "flags": 2,
            "sourcesystemid": "0x67460c2f56774ed27eeb8685f29f6cec0b090b00",
            "hashtransfers": "0x93627982c965405f6e985c2bea7d29ce16c863e7414b3577268d023a5ffec766",
            "destinationsystemid": "0xa6ef9ea235635e328124ff3429db9f9e91b64e2d",
            "destinationcurrencyid": "0x67460c2f56774ed27eeb8685f29f6cec0b090b00",
            "sourceheightstart": 1,
            "sourceheightend": 2,
            "numinputs": 15,
            "totalamounts": [{
                    "currency": "0xf0a1263056c30e221f0f851c36b767fff2544f7f",
                    "amount": 8400000000
                },
                {
                    "currency": "0x67460c2f56774ed27eeb8685f29f6cec0b090b00",
                    "amount": 8912580
                }
            ],
            "totalfees": [{
                "currency": "0x67460c2f56774ed27eeb8685f29f6cec0b090b00",
                "amount": 8912580
            }],
            "totalburned": [{
                "currency": "0x0000000000000000000000000000000000000000",
                "amount": 0
            }],
            "rewardaddress": {
                "destinationtype": 9,
                "destinationaddress": "0xb26820ee0c9b1276aac834cf457026a575dfce84"
            },
            "firstinput": 1
        },
        "partialtransactionproof": {
            "version": 1,
            "typeC": 2,
            "txproof": [{
                    "branchType": 2,
                    "proofSequence": {
                        "CMerkleBranchBase": 2,
                        "nIndex": 1,
                        "nSize": 3,
                        "branch": [
                            "0x59dcbc2fdd05afa7056d05f2d9fde04e9d08e701693c5e58d79318d41e41b6f0"
                        ],
                        "txHeight": 2
                    }
                },
                {
                    "branchType": 2,
                    "proofSequence": {
                        "CMerkleBranchBase": 2,
                        "nIndex": 0,
                        "nSize": 2,
                        "branch": [
                            "0xfb0f8a2d67b03683ee9c24c9811b6aae01b69d05d511c4afef1e136f04000000"
                        ],
                        "txHeight": 0
                    }
                },
                {
                    "branchType": 3,
                    "proofSequence": {
                        "CMerkleBranchBase": 3,
                        "nIndex": 139266,
                        "nSize": 13253,
                        "branch": [
                            "0x1357541100000000000000000000000000000000000000000000000000000000",
                            "0x9a8b0f0cbae7de0e082ae8a7eb59518b499102f0d47ce5b0606e8c0d563c2ec9",
                            "0x2d104d22000000000000000000000000ae94df63ce0a00000000000000000000",
                            "0xe7aaef86d62f63c52fc4bae9a6a854cabaeb8324ed28db872e4989d4fe2977fd",
                            "0x3c441944000000000000000000000000ae94df63ce0a00000000000000000000",
                            "0x0440d86d573762edfbec2d24187f33e8ff9f9f554e492e361ad4818da5284241",
                            "0x49fb38840000000000000000000000007d69719d362a00000000000000000000",
                            "0x14663bb32fad2d6bc0cbe81fbfb5b0c9197dabf6f6d6e562a97ff56e47efd61b",
                            "0x05e0f0ed000000000000000000000000ea4ad0793a5500000000000000000000",
                            "0xc4d4cae262b31ad927f9cb8d0db3da0f5b638c0b7438525fda6af1591cc6a3e0",
                            "0x72531dad01000000000000000000000033dbd7b7fdc600000000000000000000",
                            "0x7bdeec6adbbf1ce1b347510bebd3da00b321af6aadea49423587e92bd3f3b995",
                            "0xa139bec4030000000000000000000000e334f5eef79c01000000000000000000",
                            "0xa90a9ceb5c8842f385fe7dbca6407d50a5c30bea0c8701301766394968d340fc",
                            "0x685b38060e00000000000000000000007f3f81529f1804000000000000000000",
                            "0xdd925d26f1bfb2c551e7acf17d8743e7c5a8a90fd78d6753047c9f45e89199e4",
                            "0x9b4274480e0000000000000000000000580cba38244004000000000000000000",
                            "0xdd68615394af0d911aaca63df43a04ac6ddc40b5118ba8dc8e84ef73a6c023e8",
                            "0x4d7618b8840300000000000000000000a9f0e08eac8e42010000000000000000"
                        ],
                        "txHeight": 13185
                    }
                }
            ],
            "components": [{
                    "elType": 1,
                    "elIdx": 0,
                    "elVchObj": "0xde0e94f97d62ab5f6858c705a6675c311e8fc69299fe531c4570ab89143ae4b9010400000085202f891000000001000000000000000000000000000000953300000000000000000000",
                    "elProof": [{
                        "branchType": 2,
                        "proofSequence": {
                            "CMerkleBranchBase": 2,
                            "nIndex": 0,
                            "nSize": 34,
                            "branch": [
                                "0x586ec0ab512e84311701be161dda07ca5ef7ed40b98b00c4b0ad7fc396645ca3",
                                "0x9f112ff1b849641e15631c67f8ea5000ea81c03a06ea07aa5941ae73e89ee86c",
                                "0x00bd0f31d16159ad9e0f97aa57823c94a22c76249edba0020dc83b1811bc5c7e",
                                "0x77ff64daf419652e3873a4c655526eee5f9ed374a44b56a3e1c30dc3ce213d6c",
                                "0x7c2a50a6d472ee2428adc01ebcd55c0ae63b67329f11f7a18941f8f3e22b3257",
                                "0x3ca37b7e6b6a65911d345cb7f0914122670eaeeee238a5025beefb8b6ce94a6f"
                            ],
                            "txHeight": 0
                        }
                    }]
                },
                {
                    "elType": 2,
                    "elIdx": 0,
                    "elVchObj": "0xe4bb3eacb9ac8d38c5c68333b246bcf068aa1a0a62be697c720b782aca3e166f01000000ffffffff",
                    "elProof": [{
                        "branchType": 2,
                        "proofSequence": {
                            "CMerkleBranchBase": 2,
                            "nIndex": 1,
                            "nSize": 34,
                            "branch": [
                                "0xb94a309c951df716e2c765a83bd54ffee1698ada22681a1538de98af2499df19",
                                "0x9f112ff1b849641e15631c67f8ea5000ea81c03a06ea07aa5941ae73e89ee86c",
                                "0x00bd0f31d16159ad9e0f97aa57823c94a22c76249edba0020dc83b1811bc5c7e",
                                "0x77ff64daf419652e3873a4c655526eee5f9ed374a44b56a3e1c30dc3ce213d6c",
                                "0x7c2a50a6d472ee2428adc01ebcd55c0ae63b67329f11f7a18941f8f3e22b3257",
                                "0x3ca37b7e6b6a65911d345cb7f0914122670eaeeee238a5025beefb8b6ce94a6f"
                            ],
                            "txHeight": 1
                        }
                    }]
                },
                {
                    "elType": 4,
                    "elIdx": 0,
                    "elVchObj": "0x0000000000000000fd32011a04030001011452047d0db35c330271aae70bedce996b5239ca5ccc4d120104030c01011452047d0db35c330271aae70bedce996b5239ca5c4cf601008000a6ef9ea235635e328124ff3429db9f9e91b64e2d93627982c965405f6e985c2bea7d29ce16c863e7414b3577268d023a5ffec76667460c2f56774ed27eeb8685f29f6cec0b090b0067460c2f56774ed27eeb8685f29f6cec0b090b00be24e6000f0000000267460c2f56774ed27eeb8685f29f6cec0b090b00c4fe870000000000f0a1263056c30e221f0f851c36b767fff2544f7f00d4adf401000000000267460c2f56774ed27eeb8685f29f6cec0b090b00c4fe870000000000f0a1263056c30e221f0f851c36b767fff2544f7f00d4adf4010000000214ee154c93eb0b730b10e4aa34a804fde9d874923e010000000075",
                    "elProof": [{
                        "branchType": 2,
                        "proofSequence": {
                            "CMerkleBranchBase": 2,
                            "nIndex": 3,
                            "nSize": 34,
                            "branch": [
                                "0x307a90237b6f3195e57d57f11ef71482c0cfd7981288c7d9b732196156d7c515",
                                "0x30f5c099e3954bd22a10842f0f1eb0afd483b5b35dc1e805cbd77af6a15dd8ca"
                            ],
                            "txHeight": 33
                        }
                    }]
                }
            ]
        },
        "transfers": [{
                "version": 1,
                "flags": 65,
                "crosssystem": true,
                "feecurrencyid": "0x67460c2f56774ed27eeb8685f29f6cec0b090b00",
                "fees": 594172,
                "destination": {
                    "destinationaddress": "0x37245c7f865b5c1b6f1db81523ccf3626df625bc",
                    "destinationtype": 9
                },
                "secondreserveid": "0x0000000000000000000000000000000000000000",
                "currencyvalue": {
                    "currency": "0xf0a1263056c30e221f0f851c36b767fff2544f7f",
                    "amount": 700000000
                },
                "destcurrencyid": "0x67460c2f56774ed27eeb8685f29f6cec0b090b00",
                "destsystemid": "0x67460c2f56774ed27eeb8685f29f6cec0b090b00"
            },
            {
                "version": 1,
                "flags": 65,
                "crosssystem": true,
                "feecurrencyid": "0x67460c2f56774ed27eeb8685f29f6cec0b090b00",
                "fees": 594172,
                "destination": {
                    "destinationaddress": "0x37245c7f865b5c1b6f1db81523ccf3626df625bc",
                    "destinationtype": 9
                },
                "secondreserveid": "0x0000000000000000000000000000000000000000",
                "currencyvalue": {
                    "currency": "0xf0a1263056c30e221f0f851c36b767fff2544f7f",
                    "amount": 700000000
                },
                "destcurrencyid": "0x67460c2f56774ed27eeb8685f29f6cec0b090b00",
                "destsystemid": "0x67460c2f56774ed27eeb8685f29f6cec0b090b00"
            },
            {
                "version": 1,
                "flags": 65,
                "crosssystem": true,
                "feecurrencyid": "0x67460c2f56774ed27eeb8685f29f6cec0b090b00",
                "fees": 594172,
                "destination": {
                    "destinationaddress": "0x37245c7f865b5c1b6f1db81523ccf3626df625bc",
                    "destinationtype": 9
                },
                "secondreserveid": "0x0000000000000000000000000000000000000000",
                "currencyvalue": {
                    "currency": "0xf0a1263056c30e221f0f851c36b767fff2544f7f",
                    "amount": 400000000
                },
                "destcurrencyid": "0x67460c2f56774ed27eeb8685f29f6cec0b090b00",
                "destsystemid": "0x67460c2f56774ed27eeb8685f29f6cec0b090b00"
            },
            {
                "version": 1,
                "flags": 65,
                "crosssystem": true,
                "feecurrencyid": "0x67460c2f56774ed27eeb8685f29f6cec0b090b00",
                "fees": 594172,
                "destination": {
                    "destinationaddress": "0x37245c7f865b5c1b6f1db81523ccf3626df625bc",
                    "destinationtype": 9
                },
                "secondreserveid": "0x0000000000000000000000000000000000000000",
                "currencyvalue": {
                    "currency": "0xf0a1263056c30e221f0f851c36b767fff2544f7f",
                    "amount": 700000000
                },
                "destcurrencyid": "0x67460c2f56774ed27eeb8685f29f6cec0b090b00",
                "destsystemid": "0x67460c2f56774ed27eeb8685f29f6cec0b090b00"
            },
            {
                "version": 1,
                "flags": 65,
                "crosssystem": true,
                "feecurrencyid": "0x67460c2f56774ed27eeb8685f29f6cec0b090b00",
                "fees": 594172,
                "destination": {
                    "destinationaddress": "0x37245c7f865b5c1b6f1db81523ccf3626df625bc",
                    "destinationtype": 9
                },
                "secondreserveid": "0x0000000000000000000000000000000000000000",
                "currencyvalue": {
                    "currency": "0xf0a1263056c30e221f0f851c36b767fff2544f7f",
                    "amount": 500000000
                },
                "destcurrencyid": "0x67460c2f56774ed27eeb8685f29f6cec0b090b00",
                "destsystemid": "0x67460c2f56774ed27eeb8685f29f6cec0b090b00"
            },
            {
                "version": 1,
                "flags": 65,
                "crosssystem": true,
                "feecurrencyid": "0x67460c2f56774ed27eeb8685f29f6cec0b090b00",
                "fees": 594172,
                "destination": {
                    "destinationaddress": "0x37245c7f865b5c1b6f1db81523ccf3626df625bc",
                    "destinationtype": 9
                },
                "secondreserveid": "0x0000000000000000000000000000000000000000",
                "currencyvalue": {
                    "currency": "0xf0a1263056c30e221f0f851c36b767fff2544f7f",
                    "amount": 700000000
                },
                "destcurrencyid": "0x67460c2f56774ed27eeb8685f29f6cec0b090b00",
                "destsystemid": "0x67460c2f56774ed27eeb8685f29f6cec0b090b00"
            },
            {
                "version": 1,
                "flags": 65,
                "crosssystem": true,
                "feecurrencyid": "0x67460c2f56774ed27eeb8685f29f6cec0b090b00",
                "fees": 594172,
                "destination": {
                    "destinationaddress": "0x37245c7f865b5c1b6f1db81523ccf3626df625bc",
                    "destinationtype": 9
                },
                "secondreserveid": "0x0000000000000000000000000000000000000000",
                "currencyvalue": {
                    "currency": "0xf0a1263056c30e221f0f851c36b767fff2544f7f",
                    "amount": 300000000
                },
                "destcurrencyid": "0x67460c2f56774ed27eeb8685f29f6cec0b090b00",
                "destsystemid": "0x67460c2f56774ed27eeb8685f29f6cec0b090b00"
            },
            {
                "version": 1,
                "flags": 65,
                "crosssystem": true,
                "feecurrencyid": "0x67460c2f56774ed27eeb8685f29f6cec0b090b00",
                "fees": 594172,
                "destination": {
                    "destinationaddress": "0x37245c7f865b5c1b6f1db81523ccf3626df625bc",
                    "destinationtype": 9
                },
                "secondreserveid": "0x0000000000000000000000000000000000000000",
                "currencyvalue": {
                    "currency": "0xf0a1263056c30e221f0f851c36b767fff2544f7f",
                    "amount": 600000000
                },
                "destcurrencyid": "0x67460c2f56774ed27eeb8685f29f6cec0b090b00",
                "destsystemid": "0x67460c2f56774ed27eeb8685f29f6cec0b090b00"
            },
            {
                "version": 1,
                "flags": 65,
                "crosssystem": true,
                "feecurrencyid": "0x67460c2f56774ed27eeb8685f29f6cec0b090b00",
                "fees": 594172,
                "destination": {
                    "destinationaddress": "0x37245c7f865b5c1b6f1db81523ccf3626df625bc",
                    "destinationtype": 9
                },
                "secondreserveid": "0x0000000000000000000000000000000000000000",
                "currencyvalue": {
                    "currency": "0xf0a1263056c30e221f0f851c36b767fff2544f7f",
                    "amount": 700000000
                },
                "destcurrencyid": "0x67460c2f56774ed27eeb8685f29f6cec0b090b00",
                "destsystemid": "0x67460c2f56774ed27eeb8685f29f6cec0b090b00"
            },
            {
                "version": 1,
                "flags": 65,
                "crosssystem": true,
                "feecurrencyid": "0x67460c2f56774ed27eeb8685f29f6cec0b090b00",
                "fees": 594172,
                "destination": {
                    "destinationaddress": "0x37245c7f865b5c1b6f1db81523ccf3626df625bc",
                    "destinationtype": 9
                },
                "secondreserveid": "0x0000000000000000000000000000000000000000",
                "currencyvalue": {
                    "currency": "0xf0a1263056c30e221f0f851c36b767fff2544f7f",
                    "amount": 100000000
                },
                "destcurrencyid": "0x67460c2f56774ed27eeb8685f29f6cec0b090b00",
                "destsystemid": "0x67460c2f56774ed27eeb8685f29f6cec0b090b00"
            },
            {
                "version": 1,
                "flags": 65,
                "crosssystem": true,
                "feecurrencyid": "0x67460c2f56774ed27eeb8685f29f6cec0b090b00",
                "fees": 594172,
                "destination": {
                    "destinationaddress": "0x37245c7f865b5c1b6f1db81523ccf3626df625bc",
                    "destinationtype": 9
                },
                "secondreserveid": "0x0000000000000000000000000000000000000000",
                "currencyvalue": {
                    "currency": "0xf0a1263056c30e221f0f851c36b767fff2544f7f",
                    "amount": 700000000
                },
                "destcurrencyid": "0x67460c2f56774ed27eeb8685f29f6cec0b090b00",
                "destsystemid": "0x67460c2f56774ed27eeb8685f29f6cec0b090b00"
            },
            {
                "version": 1,
                "flags": 65,
                "crosssystem": true,
                "feecurrencyid": "0x67460c2f56774ed27eeb8685f29f6cec0b090b00",
                "fees": 594172,
                "destination": {
                    "destinationaddress": "0x37245c7f865b5c1b6f1db81523ccf3626df625bc",
                    "destinationtype": 9
                },
                "secondreserveid": "0x0000000000000000000000000000000000000000",
                "currencyvalue": {
                    "currency": "0xf0a1263056c30e221f0f851c36b767fff2544f7f",
                    "amount": 700000000
                },
                "destcurrencyid": "0x67460c2f56774ed27eeb8685f29f6cec0b090b00",
                "destsystemid": "0x67460c2f56774ed27eeb8685f29f6cec0b090b00"
            },
            {
                "version": 1,
                "flags": 65,
                "crosssystem": true,
                "feecurrencyid": "0x67460c2f56774ed27eeb8685f29f6cec0b090b00",
                "fees": 594172,
                "destination": {
                    "destinationaddress": "0x37245c7f865b5c1b6f1db81523ccf3626df625bc",
                    "destinationtype": 9
                },
                "secondreserveid": "0x0000000000000000000000000000000000000000",
                "currencyvalue": {
                    "currency": "0xf0a1263056c30e221f0f851c36b767fff2544f7f",
                    "amount": 200000000
                },
                "destcurrencyid": "0x67460c2f56774ed27eeb8685f29f6cec0b090b00",
                "destsystemid": "0x67460c2f56774ed27eeb8685f29f6cec0b090b00"
            },
            {
                "version": 1,
                "flags": 65,
                "crosssystem": true,
                "feecurrencyid": "0x67460c2f56774ed27eeb8685f29f6cec0b090b00",
                "fees": 594172,
                "destination": {
                    "destinationaddress": "0x37245c7f865b5c1b6f1db81523ccf3626df625bc",
                    "destinationtype": 9
                },
                "secondreserveid": "0x0000000000000000000000000000000000000000",
                "currencyvalue": {
                    "currency": "0xf0a1263056c30e221f0f851c36b767fff2544f7f",
                    "amount": 700000000
                },
                "destcurrencyid": "0x67460c2f56774ed27eeb8685f29f6cec0b090b00",
                "destsystemid": "0x67460c2f56774ed27eeb8685f29f6cec0b090b00"
            },
            {
                "version": 1,
                "flags": 65,
                "crosssystem": true,
                "feecurrencyid": "0x67460c2f56774ed27eeb8685f29f6cec0b090b00",
                "fees": 594172,
                "destination": {
                    "destinationaddress": "0x37245c7f865b5c1b6f1db81523ccf3626df625bc",
                    "destinationtype": 9
                },
                "secondreserveid": "0x0000000000000000000000000000000000000000",
                "currencyvalue": {
                    "currency": "0xf0a1263056c30e221f0f851c36b767fff2544f7f",
                    "amount": 700000000
                },
                "destcurrencyid": "0x67460c2f56774ed27eeb8685f29f6cec0b090b00",
                "destsystemid": "0x67460c2f56774ed27eeb8685f29f6cec0b090b00"
            }
        ],
        "serializedTransfers": "0x01f0a1263056c30e221f0f851c36b767fff2544f7f81cce3cd004167460c2f56774ed27eeb8685f29f6cec0b090b00a3a07c091437245c7f865b5c1b6f1db81523ccf3626df625bc67460c2f56774ed27eeb8685f29f6cec0b090b0067460c2f56774ed27eeb8685f29f6cec0b090b0001f0a1263056c30e221f0f851c36b767fff2544f7f81cce3cd004167460c2f56774ed27eeb8685f29f6cec0b090b00a3a07c091437245c7f865b5c1b6f1db81523ccf3626df625bc67460c2f56774ed27eeb8685f29f6cec0b090b0067460c2f56774ed27eeb8685f29f6cec0b090b0001f0a1263056c30e221f0f851c36b767fff2544f7f80bddd87004167460c2f56774ed27eeb8685f29f6cec0b090b00a3a07c091437245c7f865b5c1b6f1db81523ccf3626df625bc67460c2f56774ed27eeb8685f29f6cec0b090b0067460c2f56774ed27eeb8685f29f6cec0b090b0001f0a1263056c30e221f0f851c36b767fff2544f7f81cce3cd004167460c2f56774ed27eeb8685f29f6cec0b090b00a3a07c091437245c7f865b5c1b6f1db81523ccf3626df625bc67460c2f56774ed27eeb8685f29f6cec0b090b0067460c2f56774ed27eeb8685f29f6cec0b090b0001f0a1263056c30e221f0f851c36b767fff2544f7f80edb4c9004167460c2f56774ed27eeb8685f29f6cec0b090b00a3a07c091437245c7f865b5c1b6f1db81523ccf3626df625bc67460c2f56774ed27eeb8685f29f6cec0b090b0067460c2f56774ed27eeb8685f29f6cec0b090b0001f0a1263056c30e221f0f851c36b767fff2544f7f81cce3cd004167460c2f56774ed27eeb8685f29f6cec0b090b00a3a07c091437245c7f865b5c1b6f1db81523ccf3626df625bc67460c2f56774ed27eeb8685f29f6cec0b090b0067460c2f56774ed27eeb8685f29f6cec0b090b0001f0a1263056c30e221f0f851c36b767fff2544f7f808e85c5004167460c2f56774ed27eeb8685f29f6cec0b090b00a3a07c091437245c7f865b5c1b6f1db81523ccf3626df625bc67460c2f56774ed27eeb8685f29f6cec0b090b0067460c2f56774ed27eeb8685f29f6cec0b090b0001f0a1263056c30e221f0f851c36b767fff2544f7f819d8c8b004167460c2f56774ed27eeb8685f29f6cec0b090b00a3a07c091437245c7f865b5c1b6f1db81523ccf3626df625bc67460c2f56774ed27eeb8685f29f6cec0b090b0067460c2f56774ed27eeb8685f29f6cec0b090b0001f0a1263056c30e221f0f851c36b767fff2544f7f81cce3cd004167460c2f56774ed27eeb8685f29f6cec0b090b00a3a07c091437245c7f865b5c1b6f1db81523ccf3626df625bc67460c2f56774ed27eeb8685f29f6cec0b090b0067460c2f56774ed27eeb8685f29f6cec0b090b0001f0a1263056c30e221f0f851c36b767fff2544f7faed6c1004167460c2f56774ed27eeb8685f29f6cec0b090b00a3a07c091437245c7f865b5c1b6f1db81523ccf3626df625bc67460c2f56774ed27eeb8685f29f6cec0b090b0067460c2f56774ed27eeb8685f29f6cec0b090b0001f0a1263056c30e221f0f851c36b767fff2544f7f81cce3cd004167460c2f56774ed27eeb8685f29f6cec0b090b00a3a07c091437245c7f865b5c1b6f1db81523ccf3626df625bc67460c2f56774ed27eeb8685f29f6cec0b090b0067460c2f56774ed27eeb8685f29f6cec0b090b0001f0a1263056c30e221f0f851c36b767fff2544f7f81cce3cd004167460c2f56774ed27eeb8685f29f6cec0b090b00a3a07c091437245c7f865b5c1b6f1db81523ccf3626df625bc67460c2f56774ed27eeb8685f29f6cec0b090b0067460c2f56774ed27eeb8685f29f6cec0b090b0001f0a1263056c30e221f0f851c36b767fff2544f7fdeae83004167460c2f56774ed27eeb8685f29f6cec0b090b00a3a07c091437245c7f865b5c1b6f1db81523ccf3626df625bc67460c2f56774ed27eeb8685f29f6cec0b090b0067460c2f56774ed27eeb8685f29f6cec0b090b0001f0a1263056c30e221f0f851c36b767fff2544f7f81cce3cd004167460c2f56774ed27eeb8685f29f6cec0b090b00a3a07c091437245c7f865b5c1b6f1db81523ccf3626df625bc67460c2f56774ed27eeb8685f29f6cec0b090b0067460c2f56774ed27eeb8685f29f6cec0b090b0001f0a1263056c30e221f0f851c36b767fff2544f7f81cce3cd004167460c2f56774ed27eeb8685f29f6cec0b090b00a3a07c091437245c7f865b5c1b6f1db81523ccf3626df625bc67460c2f56774ed27eeb8685f29f6cec0b090b0067460c2f56774ed27eeb8685f29f6cec0b090b00"
    },
    {
        "height": 13186,
        "txid": "0x812f84311e4e71e2f6cb22b02615ff3d380bfd081b6d88bf755845e685afbab8",
        "txoutnum": 0,
        "exportinfo": {
            "version": 1,
            "flags": 2,
            "sourcesystemid": "0x67460c2f56774ed27eeb8685f29f6cec0b090b00",
            "hashtransfers": "0x846915df078565a8062b549ce195927324192620e887e7964334634abac3d046",
            "destinationsystemid": "0xa6ef9ea235635e328124ff3429db9f9e91b64e2d",
            "destinationcurrencyid": "0x67460c2f56774ed27eeb8685f29f6cec0b090b00",
            "sourceheightstart": 1,
            "sourceheightend": 2,
            "numinputs": 14,
            "totalamounts": [{
                    "currency": "0xf0a1263056c30e221f0f851c36b767fff2544f7f",
                    "amount": 9800000000
                },
                {
                    "currency": "0x67460c2f56774ed27eeb8685f29f6cec0b090b00",
                    "amount": 5901770
                }
            ],
            "totalfees": [{
                "currency": "0x67460c2f56774ed27eeb8685f29f6cec0b090b00",
                "amount": 5901770
            }],
            "totalburned": [{
                "currency": "0x0000000000000000000000000000000000000000",
                "amount": 0
            }],
            "rewardaddress": {
                "destinationtype": 9,
                "destinationaddress": "0xb26820ee0c9b1276aac834cf457026a575dfce84"
            },
            "firstinput": 1
        },
        "partialtransactionproof": {
            "version": 1,
            "typeC": 2,
            "txproof": [{
                    "branchType": 2,
                    "proofSequence": {
                        "CMerkleBranchBase": 2,
                        "nIndex": 3,
                        "nSize": 4,
                        "branch": [
                            "0xe4e8f7ea1953610f236c868b23a566af6d07ad5fb6157d1bc8c07b4020c24e63",
                            "0x696083771883e2e9beef0407ddd1ecdda3182b81767d93b1cf380caf0f38bbc2"
                        ],
                        "txHeight": 3
                    }
                },
                {
                    "branchType": 2,
                    "proofSequence": {
                        "CMerkleBranchBase": 2,
                        "nIndex": 0,
                        "nSize": 2,
                        "branch": [
                            "0x027f15764711d603b394d98e608a2e7738622a43a91ca91ba07d20610c000000"
                        ],
                        "txHeight": 0
                    }
                },
                {
                    "branchType": 3,
                    "proofSequence": {
                        "CMerkleBranchBase": 3,
                        "nIndex": 139272,
                        "nSize": 13253,
                        "branch": [
                            "0x1c5eef1100000000000000000000000000000000000000000000000000000000",
                            "0x400546837cebc9364ab4780220f80c828b43857159787251e6c7ae594d75e06d",
                            "0x0f34cc2100000000000000000000000000000000000000000000000000000000",
                            "0xdb2c86c0e914772ed481533496e26cc4ce66dbecac424de55e227e85f8059be6",
                            "0x3c441944000000000000000000000000ae94df63ce0a00000000000000000000",
                            "0x0440d86d573762edfbec2d24187f33e8ff9f9f554e492e361ad4818da5284241",
                            "0x49fb38840000000000000000000000007d69719d362a00000000000000000000",
                            "0x14663bb32fad2d6bc0cbe81fbfb5b0c9197dabf6f6d6e562a97ff56e47efd61b",
                            "0x05e0f0ed000000000000000000000000ea4ad0793a5500000000000000000000",
                            "0xc4d4cae262b31ad927f9cb8d0db3da0f5b638c0b7438525fda6af1591cc6a3e0",
                            "0x72531dad01000000000000000000000033dbd7b7fdc600000000000000000000",
                            "0x7bdeec6adbbf1ce1b347510bebd3da00b321af6aadea49423587e92bd3f3b995",
                            "0xa139bec4030000000000000000000000e334f5eef79c01000000000000000000",
                            "0xa90a9ceb5c8842f385fe7dbca6407d50a5c30bea0c8701301766394968d340fc",
                            "0x685b38060e00000000000000000000007f3f81529f1804000000000000000000",
                            "0xdd925d26f1bfb2c551e7acf17d8743e7c5a8a90fd78d6753047c9f45e89199e4",
                            "0x9b4274480e0000000000000000000000580cba38244004000000000000000000",
                            "0xdd68615394af0d911aaca63df43a04ac6ddc40b5118ba8dc8e84ef73a6c023e8",
                            "0x4d7618b8840300000000000000000000a9f0e08eac8e42010000000000000000"
                        ],
                        "txHeight": 13186
                    }
                }
            ],
            "components": [{
                    "elType": 1,
                    "elIdx": 0,
                    "elVchObj": "0x812f84311e4e71e2f6cb22b02615ff3d380bfd081b6d88bf755845e685afbab8010400000085202f890f00000001000000000000000000000000000000963300000000000000000000",
                    "elProof": [{
                        "branchType": 2,
                        "proofSequence": {
                            "CMerkleBranchBase": 2,
                            "nIndex": 0,
                            "nSize": 32,
                            "branch": [
                                "0x9b67ee38a3ccd831b066dae74496adf866833478d54eca8c8b9b35aaa4bf88d4",
                                "0xeae85c94ca0213feac4ef608f42315c45db6762be0bdce024d5c35d1fe7b3446",
                                "0x3fe21e4bceecd5c12649f3fde96cf17bd61b3516b6f73e1841b96209e25cd0e9",
                                "0x9139ca196e724c396b593329e2c79bf608eb1661311859cdd6f53da800f2411c",
                                "0x39b134c03b61b2869a36ead52062c288f8d010b11006db7cf12f1a1b7c194f90"
                            ],
                            "txHeight": 0
                        }
                    }]
                },
                {
                    "elType": 2,
                    "elIdx": 0,
                    "elVchObj": "0xde0e94f97d62ab5f6858c705a6675c311e8fc69299fe531c4570ab89143ae4b900000000ffffffff",
                    "elProof": [{
                        "branchType": 2,
                        "proofSequence": {
                            "CMerkleBranchBase": 2,
                            "nIndex": 1,
                            "nSize": 32,
                            "branch": [
                                "0x68ba81e6edea683982a0fdc0ab0200f29315fc185ca7018e6cf45901b869c821",
                                "0xeae85c94ca0213feac4ef608f42315c45db6762be0bdce024d5c35d1fe7b3446",
                                "0x3fe21e4bceecd5c12649f3fde96cf17bd61b3516b6f73e1841b96209e25cd0e9",
                                "0x9139ca196e724c396b593329e2c79bf608eb1661311859cdd6f53da800f2411c",
                                "0x39b134c03b61b2869a36ead52062c288f8d010b11006db7cf12f1a1b7c194f90"
                            ],
                            "txHeight": 1
                        }
                    }]
                },
                {
                    "elType": 4,
                    "elIdx": 0,
                    "elVchObj": "0x0000000000000000fd32011a04030001011452047d0db35c330271aae70bedce996b5239ca5ccc4d120104030c01011452047d0db35c330271aae70bedce996b5239ca5c4cf601008000a6ef9ea235635e328124ff3429db9f9e91b64e2d846915df078565a8062b549ce195927324192620e887e7964334634abac3d04667460c2f56774ed27eeb8685f29f6cec0b090b0067460c2f56774ed27eeb8685f29f6cec0b090b00e601e6010e0000000267460c2f56774ed27eeb8685f29f6cec0b090b00ca0d5a0000000000f0a1263056c30e221f0f851c36b767fff2544f7f0022204802000000000267460c2f56774ed27eeb8685f29f6cec0b090b00ca0d5a0000000000f0a1263056c30e221f0f851c36b767fff2544f7f00222048020000000214b77141f1ba9f8ed5f4156315c03f5abf7885efd3010000000075",
                    "elProof": [{
                        "branchType": 2,
                        "proofSequence": {
                            "CMerkleBranchBase": 2,
                            "nIndex": 31,
                            "nSize": 32,
                            "branch": [
                                "0xad44399e559e61276c429b08a826d24847df28cddeccddfce6e54075490a88e3",
                                "0x8193fe4248d3ef57880f6629e385674f69ac2e477082f8fd6277a331e424cd03",
                                "0x15b9635f6a90e7f05ef3fefd414fed360a9ca5725b564f407be71007576ecb25",
                                "0x07262ec1e0acc91bb17adb2745e1fa244d3d05a6915b07971fcc747d031d922e",
                                "0xdc98af08973713b933df9c4753219da81692657371712882c05a728c4ab96354"
                            ],
                            "txHeight": 31
                        }
                    }]
                }
            ]
        },
        "transfers": [{
                "version": 1,
                "flags": 65,
                "crosssystem": true,
                "feecurrencyid": "0x67460c2f56774ed27eeb8685f29f6cec0b090b00",
                "fees": 421555,
                "destination": {
                    "destinationaddress": "0x37245c7f865b5c1b6f1db81523ccf3626df625bc",
                    "destinationtype": 9
                },
                "secondreserveid": "0x0000000000000000000000000000000000000000",
                "currencyvalue": {
                    "currency": "0xf0a1263056c30e221f0f851c36b767fff2544f7f",
                    "amount": 700000000
                },
                "destcurrencyid": "0x67460c2f56774ed27eeb8685f29f6cec0b090b00",
                "destsystemid": "0x67460c2f56774ed27eeb8685f29f6cec0b090b00"
            },
            {
                "version": 1,
                "flags": 65,
                "crosssystem": true,
                "feecurrencyid": "0x67460c2f56774ed27eeb8685f29f6cec0b090b00",
                "fees": 421555,
                "destination": {
                    "destinationaddress": "0x37245c7f865b5c1b6f1db81523ccf3626df625bc",
                    "destinationtype": 9
                },
                "secondreserveid": "0x0000000000000000000000000000000000000000",
                "currencyvalue": {
                    "currency": "0xf0a1263056c30e221f0f851c36b767fff2544f7f",
                    "amount": 700000000
                },
                "destcurrencyid": "0x67460c2f56774ed27eeb8685f29f6cec0b090b00",
                "destsystemid": "0x67460c2f56774ed27eeb8685f29f6cec0b090b00"
            },
            {
                "version": 1,
                "flags": 65,
                "crosssystem": true,
                "feecurrencyid": "0x67460c2f56774ed27eeb8685f29f6cec0b090b00",
                "fees": 421555,
                "destination": {
                    "destinationaddress": "0x37245c7f865b5c1b6f1db81523ccf3626df625bc",
                    "destinationtype": 9
                },
                "secondreserveid": "0x0000000000000000000000000000000000000000",
                "currencyvalue": {
                    "currency": "0xf0a1263056c30e221f0f851c36b767fff2544f7f",
                    "amount": 700000000
                },
                "destcurrencyid": "0x67460c2f56774ed27eeb8685f29f6cec0b090b00",
                "destsystemid": "0x67460c2f56774ed27eeb8685f29f6cec0b090b00"
            },
            {
                "version": 1,
                "flags": 65,
                "crosssystem": true,
                "feecurrencyid": "0x67460c2f56774ed27eeb8685f29f6cec0b090b00",
                "fees": 421555,
                "destination": {
                    "destinationaddress": "0x37245c7f865b5c1b6f1db81523ccf3626df625bc",
                    "destinationtype": 9
                },
                "secondreserveid": "0x0000000000000000000000000000000000000000",
                "currencyvalue": {
                    "currency": "0xf0a1263056c30e221f0f851c36b767fff2544f7f",
                    "amount": 700000000
                },
                "destcurrencyid": "0x67460c2f56774ed27eeb8685f29f6cec0b090b00",
                "destsystemid": "0x67460c2f56774ed27eeb8685f29f6cec0b090b00"
            },
            {
                "version": 1,
                "flags": 65,
                "crosssystem": true,
                "feecurrencyid": "0x67460c2f56774ed27eeb8685f29f6cec0b090b00",
                "fees": 421555,
                "destination": {
                    "destinationaddress": "0x37245c7f865b5c1b6f1db81523ccf3626df625bc",
                    "destinationtype": 9
                },
                "secondreserveid": "0x0000000000000000000000000000000000000000",
                "currencyvalue": {
                    "currency": "0xf0a1263056c30e221f0f851c36b767fff2544f7f",
                    "amount": 700000000
                },
                "destcurrencyid": "0x67460c2f56774ed27eeb8685f29f6cec0b090b00",
                "destsystemid": "0x67460c2f56774ed27eeb8685f29f6cec0b090b00"
            },
            {
                "version": 1,
                "flags": 65,
                "crosssystem": true,
                "feecurrencyid": "0x67460c2f56774ed27eeb8685f29f6cec0b090b00",
                "fees": 421555,
                "destination": {
                    "destinationaddress": "0x37245c7f865b5c1b6f1db81523ccf3626df625bc",
                    "destinationtype": 9
                },
                "secondreserveid": "0x0000000000000000000000000000000000000000",
                "currencyvalue": {
                    "currency": "0xf0a1263056c30e221f0f851c36b767fff2544f7f",
                    "amount": 700000000
                },
                "destcurrencyid": "0x67460c2f56774ed27eeb8685f29f6cec0b090b00",
                "destsystemid": "0x67460c2f56774ed27eeb8685f29f6cec0b090b00"
            },
            {
                "version": 1,
                "flags": 65,
                "crosssystem": true,
                "feecurrencyid": "0x67460c2f56774ed27eeb8685f29f6cec0b090b00",
                "fees": 421555,
                "destination": {
                    "destinationaddress": "0x37245c7f865b5c1b6f1db81523ccf3626df625bc",
                    "destinationtype": 9
                },
                "secondreserveid": "0x0000000000000000000000000000000000000000",
                "currencyvalue": {
                    "currency": "0xf0a1263056c30e221f0f851c36b767fff2544f7f",
                    "amount": 700000000
                },
                "destcurrencyid": "0x67460c2f56774ed27eeb8685f29f6cec0b090b00",
                "destsystemid": "0x67460c2f56774ed27eeb8685f29f6cec0b090b00"
            },
            {
                "version": 1,
                "flags": 65,
                "crosssystem": true,
                "feecurrencyid": "0x67460c2f56774ed27eeb8685f29f6cec0b090b00",
                "fees": 421555,
                "destination": {
                    "destinationaddress": "0x37245c7f865b5c1b6f1db81523ccf3626df625bc",
                    "destinationtype": 9
                },
                "secondreserveid": "0x0000000000000000000000000000000000000000",
                "currencyvalue": {
                    "currency": "0xf0a1263056c30e221f0f851c36b767fff2544f7f",
                    "amount": 700000000
                },
                "destcurrencyid": "0x67460c2f56774ed27eeb8685f29f6cec0b090b00",
                "destsystemid": "0x67460c2f56774ed27eeb8685f29f6cec0b090b00"
            },
            {
                "version": 1,
                "flags": 65,
                "crosssystem": true,
                "feecurrencyid": "0x67460c2f56774ed27eeb8685f29f6cec0b090b00",
                "fees": 421555,
                "destination": {
                    "destinationaddress": "0x37245c7f865b5c1b6f1db81523ccf3626df625bc",
                    "destinationtype": 9
                },
                "secondreserveid": "0x0000000000000000000000000000000000000000",
                "currencyvalue": {
                    "currency": "0xf0a1263056c30e221f0f851c36b767fff2544f7f",
                    "amount": 700000000
                },
                "destcurrencyid": "0x67460c2f56774ed27eeb8685f29f6cec0b090b00",
                "destsystemid": "0x67460c2f56774ed27eeb8685f29f6cec0b090b00"
            },
            {
                "version": 1,
                "flags": 65,
                "crosssystem": true,
                "feecurrencyid": "0x67460c2f56774ed27eeb8685f29f6cec0b090b00",
                "fees": 421555,
                "destination": {
                    "destinationaddress": "0x37245c7f865b5c1b6f1db81523ccf3626df625bc",
                    "destinationtype": 9
                },
                "secondreserveid": "0x0000000000000000000000000000000000000000",
                "currencyvalue": {
                    "currency": "0xf0a1263056c30e221f0f851c36b767fff2544f7f",
                    "amount": 700000000
                },
                "destcurrencyid": "0x67460c2f56774ed27eeb8685f29f6cec0b090b00",
                "destsystemid": "0x67460c2f56774ed27eeb8685f29f6cec0b090b00"
            },
            {
                "version": 1,
                "flags": 65,
                "crosssystem": true,
                "feecurrencyid": "0x67460c2f56774ed27eeb8685f29f6cec0b090b00",
                "fees": 421555,
                "destination": {
                    "destinationaddress": "0x37245c7f865b5c1b6f1db81523ccf3626df625bc",
                    "destinationtype": 9
                },
                "secondreserveid": "0x0000000000000000000000000000000000000000",
                "currencyvalue": {
                    "currency": "0xf0a1263056c30e221f0f851c36b767fff2544f7f",
                    "amount": 700000000
                },
                "destcurrencyid": "0x67460c2f56774ed27eeb8685f29f6cec0b090b00",
                "destsystemid": "0x67460c2f56774ed27eeb8685f29f6cec0b090b00"
            },
            {
                "version": 1,
                "flags": 65,
                "crosssystem": true,
                "feecurrencyid": "0x67460c2f56774ed27eeb8685f29f6cec0b090b00",
                "fees": 421555,
                "destination": {
                    "destinationaddress": "0x37245c7f865b5c1b6f1db81523ccf3626df625bc",
                    "destinationtype": 9
                },
                "secondreserveid": "0x0000000000000000000000000000000000000000",
                "currencyvalue": {
                    "currency": "0xf0a1263056c30e221f0f851c36b767fff2544f7f",
                    "amount": 700000000
                },
                "destcurrencyid": "0x67460c2f56774ed27eeb8685f29f6cec0b090b00",
                "destsystemid": "0x67460c2f56774ed27eeb8685f29f6cec0b090b00"
            },
            {
                "version": 1,
                "flags": 65,
                "crosssystem": true,
                "feecurrencyid": "0x67460c2f56774ed27eeb8685f29f6cec0b090b00",
                "fees": 421555,
                "destination": {
                    "destinationaddress": "0x37245c7f865b5c1b6f1db81523ccf3626df625bc",
                    "destinationtype": 9
                },
                "secondreserveid": "0x0000000000000000000000000000000000000000",
                "currencyvalue": {
                    "currency": "0xf0a1263056c30e221f0f851c36b767fff2544f7f",
                    "amount": 700000000
                },
                "destcurrencyid": "0x67460c2f56774ed27eeb8685f29f6cec0b090b00",
                "destsystemid": "0x67460c2f56774ed27eeb8685f29f6cec0b090b00"
            },
            {
                "version": 1,
                "flags": 65,
                "crosssystem": true,
                "feecurrencyid": "0x67460c2f56774ed27eeb8685f29f6cec0b090b00",
                "fees": 421555,
                "destination": {
                    "destinationaddress": "0x37245c7f865b5c1b6f1db81523ccf3626df625bc",
                    "destinationtype": 9
                },
                "secondreserveid": "0x0000000000000000000000000000000000000000",
                "currencyvalue": {
                    "currency": "0xf0a1263056c30e221f0f851c36b767fff2544f7f",
                    "amount": 700000000
                },
                "destcurrencyid": "0x67460c2f56774ed27eeb8685f29f6cec0b090b00",
                "destsystemid": "0x67460c2f56774ed27eeb8685f29f6cec0b090b00"
            }
        ],
        "serializedTransfers": "0x01f0a1263056c30e221f0f851c36b767fff2544f7f81cce3cd004167460c2f56774ed27eeb8685f29f6cec0b090b0098dc33091437245c7f865b5c1b6f1db81523ccf3626df625bc67460c2f56774ed27eeb8685f29f6cec0b090b0067460c2f56774ed27eeb8685f29f6cec0b090b0001f0a1263056c30e221f0f851c36b767fff2544f7f81cce3cd004167460c2f56774ed27eeb8685f29f6cec0b090b0098dc33091437245c7f865b5c1b6f1db81523ccf3626df625bc67460c2f56774ed27eeb8685f29f6cec0b090b0067460c2f56774ed27eeb8685f29f6cec0b090b0001f0a1263056c30e221f0f851c36b767fff2544f7f81cce3cd004167460c2f56774ed27eeb8685f29f6cec0b090b0098dc33091437245c7f865b5c1b6f1db81523ccf3626df625bc67460c2f56774ed27eeb8685f29f6cec0b090b0067460c2f56774ed27eeb8685f29f6cec0b090b0001f0a1263056c30e221f0f851c36b767fff2544f7f81cce3cd004167460c2f56774ed27eeb8685f29f6cec0b090b0098dc33091437245c7f865b5c1b6f1db81523ccf3626df625bc67460c2f56774ed27eeb8685f29f6cec0b090b0067460c2f56774ed27eeb8685f29f6cec0b090b0001f0a1263056c30e221f0f851c36b767fff2544f7f81cce3cd004167460c2f56774ed27eeb8685f29f6cec0b090b0098dc33091437245c7f865b5c1b6f1db81523ccf3626df625bc67460c2f56774ed27eeb8685f29f6cec0b090b0067460c2f56774ed27eeb8685f29f6cec0b090b0001f0a1263056c30e221f0f851c36b767fff2544f7f81cce3cd004167460c2f56774ed27eeb8685f29f6cec0b090b0098dc33091437245c7f865b5c1b6f1db81523ccf3626df625bc67460c2f56774ed27eeb8685f29f6cec0b090b0067460c2f56774ed27eeb8685f29f6cec0b090b0001f0a1263056c30e221f0f851c36b767fff2544f7f81cce3cd004167460c2f56774ed27eeb8685f29f6cec0b090b0098dc33091437245c7f865b5c1b6f1db81523ccf3626df625bc67460c2f56774ed27eeb8685f29f6cec0b090b0067460c2f56774ed27eeb8685f29f6cec0b090b0001f0a1263056c30e221f0f851c36b767fff2544f7f81cce3cd004167460c2f56774ed27eeb8685f29f6cec0b090b0098dc33091437245c7f865b5c1b6f1db81523ccf3626df625bc67460c2f56774ed27eeb8685f29f6cec0b090b0067460c2f56774ed27eeb8685f29f6cec0b090b0001f0a1263056c30e221f0f851c36b767fff2544f7f81cce3cd004167460c2f56774ed27eeb8685f29f6cec0b090b0098dc33091437245c7f865b5c1b6f1db81523ccf3626df625bc67460c2f56774ed27eeb8685f29f6cec0b090b0067460c2f56774ed27eeb8685f29f6cec0b090b0001f0a1263056c30e221f0f851c36b767fff2544f7f81cce3cd004167460c2f56774ed27eeb8685f29f6cec0b090b0098dc33091437245c7f865b5c1b6f1db81523ccf3626df625bc67460c2f56774ed27eeb8685f29f6cec0b090b0067460c2f56774ed27eeb8685f29f6cec0b090b0001f0a1263056c30e221f0f851c36b767fff2544f7f81cce3cd004167460c2f56774ed27eeb8685f29f6cec0b090b0098dc33091437245c7f865b5c1b6f1db81523ccf3626df625bc67460c2f56774ed27eeb8685f29f6cec0b090b0067460c2f56774ed27eeb8685f29f6cec0b090b0001f0a1263056c30e221f0f851c36b767fff2544f7f81cce3cd004167460c2f56774ed27eeb8685f29f6cec0b090b0098dc33091437245c7f865b5c1b6f1db81523ccf3626df625bc67460c2f56774ed27eeb8685f29f6cec0b090b0067460c2f56774ed27eeb8685f29f6cec0b090b0001f0a1263056c30e221f0f851c36b767fff2544f7f81cce3cd004167460c2f56774ed27eeb8685f29f6cec0b090b0098dc33091437245c7f865b5c1b6f1db81523ccf3626df625bc67460c2f56774ed27eeb8685f29f6cec0b090b0067460c2f56774ed27eeb8685f29f6cec0b090b0001f0a1263056c30e221f0f851c36b767fff2544f7f81cce3cd004167460c2f56774ed27eeb8685f29f6cec0b090b0098dc33091437245c7f865b5c1b6f1db81523ccf3626df625bc67460c2f56774ed27eeb8685f29f6cec0b090b0067460c2f56774ed27eeb8685f29f6cec0b090b00"
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

const testserialized = "0x0167460c2f56774ed27eeb8685f29f6cec0b090b0088c3d9004167460c2f56774ed27eeb8685f29f6cec0b090b0092c30009148c7d6364f1bf43248f2b26060dbd29da01d7dd3167460c2f56774ed27eeb8685f29f6cec0b090b0067460c2f56774ed27eeb8685f29f6cec0b090b0001f0a1263056c30e221f0f851c36b767fff2544f7f8ba4c781004167460c2f56774ed27eeb8685f29f6cec0b090b0092c30009148c7d6364f1bf43248f2b26060dbd29da01d7dd3167460c2f56774ed27eeb8685f29f6cec0b090b0067460c2f56774ed27eeb8685f29f6cec0b090b0001a6ef9ea235635e328124ff3429db9f9e91b64e2d879884ab004167460c2f56774ed27eeb8685f29f6cec0b090b0092c30009148c7d6364f1bf43248f2b26060dbd29da01d7dd3167460c2f56774ed27eeb8685f29f6cec0b090b0067460c2f56774ed27eeb8685f29f6cec0b090b00"




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
        console.log("\nserializedtxs: ", serializedtxs1);
        // console.log("\nprocessTransactions: ", revv5);

    } catch (e) {
        console.log(e);
    }
    process.exit(0);
}


testfunc1();
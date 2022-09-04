const Web3 = require('web3');

const confFile = require('../confFile.js')
var constants = require('../constants');
const util = require('../utils.js');

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
const verusBridge = new web3.eth.Contract(verusBridgeAbi, "0xa5706789ceDcb7C884eE0c6fe593F0f83B9f8B5c");

const ERC20Abi = require('../abi/ERC20.json');
const erctoken = new web3.eth.Contract(ERC20Abi, "0x98339D8C260052B7ad81c28c16C0b98420f2B46a"); //goerli erc20 of usdc

let account = web3.eth.accounts.privateKeyToAccount(settings.privatekey);
web3.eth.accounts.wallet.add(account);
web3.eth.handleRevert = true
const maxGas = 6000000;
const ETH_FEES = "0.003"

const EG_NOTARIZATION = {
    "version": 1,
    "proposer": {
        "destinationtype": 4,
        "destinationaddress": "0xb26820ee0c9b1276aac834cf457026a575dfce84"
    },
    "currencyid": "0x67460c2f56774ed27eeb8685f29f6cec0b090b00",
    "notarizationheight": 9245504,
    "currencystate": {
        "flags": 2,
        "version": 1,
        "currencyid": "0x67460c2f56774ed27eeb8685f29f6cec0b090b00",
        "launchcurrencies": [

        ],
        "initialsupply": 0,
        "emitted": 0,
        "supply": 0,
        "primarycurrencyfees": 0,
        "primarycurrencyconversionfees": 0,
        "primarycurrencyout": 0,
        "preconvertedout": 0,
        "weights": [

        ],
        "reserves": [

        ],
        "reservein": [

        ],
        "primarycurrencyin": [

        ],
        "reserveout": [

        ],
        "conversionprice": [

        ],
        "viaconversionprice": [

        ],
        "fees": [

        ],
        "conversionfees": [

        ],
        "priorweights": [

        ],
        "currencies": [

        ]
    },
    "prevheight": 9245436,
    "currencystates": [
        {
            "currencyid": "0xa6ef9ea235635e328124ff3429db9f9e91b64e2d",
            "currencystate": {
                "flags": 16,
                "version": 1,
                "currencyid": "0xa6ef9ea235635e328124ff3429db9f9e91b64e2d",
                "launchcurrencies": [

                ],
                "initialsupply": 0,
                "emitted": 0,
                "supply": 0,
                "primarycurrencyfees": 0,
                "primarycurrencyconversionfees": 0,
                "primarycurrencyout": 0,
                "preconvertedout": 0,
                "weights": [

                ],
                "reserves": [

                ],
                "reservein": [

                ],
                "primarycurrencyin": [

                ],
                "reserveout": [

                ],
                "conversionprice": [

                ],
                "viaconversionprice": [

                ],
                "fees": [

                ],
                "conversionfees": [

                ],
                "priorweights": [

                ],
                "currencies": [

                ]
            }
        },
        {
            "currencyid": "0xffece948b8a38bbcc813411d2597f7f8485a0689",
            "currencystate": {
                "flags": 17,
                "version": 1,
               "currencyid": "0xffece948b8a38bbcc813411d2597f7f8485a0689",
             /*    "reservecurrencies": [
                    {
                        "currencyid": "iJhCezBExJHvtyH3fGhNnt2NhU4Ztkf2yq",
                        "weight": 0.33333334,
                        "reserves": 0,
                        "priceinreserve": 0.00000299
                    },
                    {
                        "currencyid": "iRQrexTecXdkiPM6Q5KHxGDmpDaGFS2wRD",
                        "weight": 0.33333333,
                        "reserves": 0,
                        "priceinreserve": 0.000003
                    },
                    {
                        "currencyid": "iCtawpxUiCc2sEupt7Z4u8SDAncGZpgSKm",
                        "weight": 0.33333333,
                        "reserves": 0,
                        "priceinreserve": 0.000003
                    }
                ], */
                "initialsupply": "100000000000000",
                "emitted": 0,
                "supply": "100000000000000",
                "currencies": [
                    "0xa6ef9ea235635e328124ff3429db9f9e91b64e2d",
                    "0xf0a1263056c30e221f0f851c36b767fff2544f7f",
                    "0x67460c2f56774ed27eeb8685f29f6cec0b090b00"
                ],
                "primarycurrencyfees": 0,
                "primarycurrencyconversionfees": 0,
                "primarycurrencyout": 0,
                "preconvertedout": 0,
                "weights": [
                    "33333334",
                    "33333333",
                    "33333333"
                ],
                "reserves": [
                    0,
                    0,
                    0
                ],
                "reservein": [
                    0,
                    0,
                    0
                ],
                "primarycurrencyin": [
                    0,
                    0,
                    0
                ],
                "reserveout": [
                    0,
                    0,
                    0
                ],
                "conversionprice": [
                    "300",
                    "301",
                    "301"
                ],
                "viaconversionprice": [
                    0,
                    0,
                    0
                ],
                "fees": [
                    0,
                    0,
                    0
                ],
                "conversionfees": [
                    0,
                    0,
                    0
                ],
                "priorweights": [
                    "33333334",
                    "33333333",
                    "33333333"
                ]
            }
        }
    ],
    "proofroots": [
        {
            "version": 1,
            "systemid": "0x67460c2f56774ed27eeb8685f29f6cec0b090b00",
            "stateroot": "0x60722bb2b88fe485a028e37ca00123b2a1cc87f3490af00d3c33f4ded6e98a00",
            "blockhash": "0xcc6171dbeefa967c64a8a2e2a9955ee510804a0d7bd94bd074357644dd4d727c",
            "cprtype": 2,
            "rootheight": 9245504,
            "compactpower": "0x0000000000000000000000000000000000000000000000000000000000ef0095"
        },
        {
            "version": 1,
            "systemid": "0xa6ef9ea235635e328124ff3429db9f9e91b64e2d",
            "stateroot": "0x867a960dbd7d050b4a5c7c7d83cf947e67c2bfe37402470d0242c8b234d39c3a",
            "blockhash": "0x0000001991944a9f305e232ffeffcea84ee58d7c61a32703c8b2dc1f58ba3a8f",
            "cprtype": 1,
            "rootheight": 27089,
            "compactpower": "0x0000000000000000000d6a7ebba85c410000000000000000000008a204e8fc00"
        }
    ],
    "nodes": [

    ],
    "flags": 268,
    "prevnotarization": {
        "hash": "0x5d81c4ac299a4e9c8c2c62f44317c8c46f495976cbcc5a837a3ed2c9e52a36de",
        "n": 1
    },
    "hashprevnotarization": "0x14904f92f727db6b3e311b6bef43255a644abb30a5b19092a7859bd6b58d231b"
}

const notarizationFlags = function (notarization) {

    if (parseInt(notarization.flags & constants.FLAG_START_NOTARIZATION) == constants.FLAG_START_NOTARIZATION) {
        notarization.launchcleared = true;
    }
    else {
        notarization.launchcleared = false;
    }

    if (parseInt(notarization.flags & constants.FLAG_LAUNCH_CONFIRMED) == constants.FLAG_LAUNCH_CONFIRMED) {
        notarization.launchconfirmed = true;
    }
    else {
        notarization.launchconfirmed = false;
    }

    if (parseInt(notarization.flags & constants.FLAG_LAUNCH_COMPLETE) == constants.FLAG_LAUNCH_COMPLETE) {
        notarization.launchcomplete = true;
    }
    else {
        notarization.launchcomplete = false;
    }

    return notarization;
}

const completeCurrencyStateToVerus = function (currencyState) {


    currencyState.currencyid = util.uint160ToVAddress(currencyState.currencyid, constants.IADDRESS);

    let tempReserveOrLaunch = [];

    for (let i = 0; i < currencyState.weights.length; i++) {

        let tempreserve = {};
        tempreserve.currencyid = util.uint160ToVAddress(currencyState.currencies[i], constants.IADDRESS);
        tempreserve.weight = util.uint64ToVerusFloat(currencyState.weights[i]);
        tempreserve.reserves = util.uint64ToVerusFloat(currencyState.reserves[i]);
        tempReserveOrLaunch.push(tempreserve);
    }

    if (parseInt(currencyState.flags) & constants.FLAG_FRACTIONAL == constants.FLAG_FRACTIONAL) {
        currencyState.reservecurrencies = tempReserveOrLaunch;
    }
    else {
        currencyState.launchcurrencies = tempReserveOrLaunch;
    }

    let currenciesiaddress = {};

    if (currencyState.currencies.length > 0) {

        for (let i = 0; i < currencyState.currencies.length; i++) {
            let tempiaddress = util.uint160ToVAddress(currencyState.currencies[i], constants.IADDRESS);
            currenciesiaddress[tempiaddress] = {};
            currenciesiaddress[tempiaddress].reservein = util.uint64ToVerusFloat(currencyState.reservein[i]);
            currenciesiaddress[tempiaddress].primarycurrencyin = util.uint64ToVerusFloat(currencyState.primarycurrencyin[i]);
            currenciesiaddress[tempiaddress].reserveout = util.uint64ToVerusFloat(currencyState.reserveout[i]);
            currenciesiaddress[tempiaddress].lastconversionprice = util.uint64ToVerusFloat(currencyState.conversionprice[i]);
            currenciesiaddress[tempiaddress].viaconversionprice = util.uint64ToVerusFloat(currencyState.viaconversionprice[i]);
            currenciesiaddress[tempiaddress].fees = util.uint64ToVerusFloat(currencyState.fees[i]);
            currenciesiaddress[tempiaddress].conversionfees = util.uint64ToVerusFloat(currencyState.conversionfees[i]);
            currenciesiaddress[tempiaddress].priorweights = util.uint64ToVerusFloat(currencyState.priorweights[i]);
        }

        currencyState.currencies = currenciesiaddress;
    }



    currencyState.initialsupply = util.uint64ToVerusFloat(currencyState.initialsupply);
    currencyState.supply = util.uint64ToVerusFloat(currencyState.supply);
    currencyState.emitted = util.uint64ToVerusFloat(currencyState.emitted);
    currencyState.primarycurrencyout = util.uint64ToVerusFloat(currencyState.primarycurrencyout);
    currencyState.preconvertedout = util.uint64ToVerusFloat(currencyState.preconvertedout);
    currencyState.primarycurrencyfees = util.uint64ToVerusFloat(currencyState.primarycurrencyfees);
    currencyState.primarycurrencyconversionfees = util.uint64ToVerusFloat(currencyState.primarycurrencyconversionfees);

    return currencyState;

}

const createNotarization = function (input) {

    let notarization = {};

    notarization = notarizationFlags(input);

    notarization.proposer.type = notarization.proposer.destinationtype;

    notarization.proposer.address = util.hexAddressToBase58(notarization.proposer.type, notarization.proposer.destinationaddress);
    delete notarization.proposer.destinationtype;
    delete notarization.proposer.destinationaddress;

    notarization.currencyid = util.uint160ToVAddress(notarization.currencyid, constants.IADDRESS);
    notarization.currencystate = completeCurrencyStateToVerus(notarization.currencystate);
    notarization.hashprevnotarizationobject = notarization.hashprevnotarization.slice(2);
    delete notarization.hashprevnotarization;

    notarization.prevnotarizationtxid = notarization.prevnotarization.hash.slice(2);
    notarization.prevnotarizationout = notarization.prevnotarization.n;
    delete notarization.prevnotarization;

    let tempcurr = {}
    for (let i = 0; i < notarization.currencystates.length; i++)
    {
        let tempcurrname = util.uint160ToVAddress(notarization.currencystates[i].currencyid, constants.IADDRESS);
        tempcurr[tempcurrname] = {}
        tempcurr[tempcurrname] = completeCurrencyStateToVerus(notarization.currencystates[i].currencystate);
    }
    notarization.currencystates = tempcurr;

    for (let i = 0; i < notarization.proofroots.length; i++)
    {
        notarization.proofroots[i].systemid = util.uint160ToVAddress(notarization.proofroots[i].systemid, constants.IADDRESS);
        notarization.proofroots[i].stateroot = notarization.proofroots[i].stateroot.slice(2);
        notarization.proofroots[i].blockhash = notarization.proofroots[i].blockhash.slice(2);
        notarization.proofroots[i].compactpower = notarization.proofroots[i].compactpower.slice(2);
        notarization.proofroots[i].type = notarization.proofroots[i].cprtype;
        notarization.proofroots[i].height = notarization.proofroots[i].rootheight;
        delete notarization.proofroots[i].cprtype;
        delete notarization.proofroots[i].rootheight;

    }

    return notarization;

}

const testfunc1 = async () => {
    try {

        let note = createNotarization(EG_NOTARIZATION);
        console.log(note);
        console.log(note.currencystates);

        for (const jim in note.currencystates)
        {
            console.log(note.currencystates[jim])
        }
    } catch (e) {
        console.log(e);
    }

}

const run = async () => {

    const ret = await testfunc1();
    console.log("finished", ret);
    process.exit(0);
}

run();
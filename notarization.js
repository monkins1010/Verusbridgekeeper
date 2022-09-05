var constants = require('./constants');
const util = require('./utils.js');

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

const completeCurrencyStateToVerus = function (input) {

    let currencyState = {};

    notKEys = Object.keys(input);

    for (const vals of notKEys)
    {
        if(isNaN(vals))
        {
            currencyState[vals] = input[vals];
        }
    }

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

    let tempnotarization = {};

    notKEys = Object.keys(input);

    for (const vals of notKEys)
    {
        if(isNaN(vals))
        {
        tempnotarization[vals] = input[vals];
        }
    }

    let notarization = notarizationFlags(tempnotarization);

    let tempPropser = {};
    tempPropser.type = notarization.proposer.destinationtype;
    tempPropser.address = util.hexAddressToBase58(notarization.proposer.destinationtype, notarization.proposer.destinationaddress);

    notarization.proposer = tempPropser;

    notarization.currencyid = util.uint160ToVAddress(notarization.currencyid, constants.IADDRESS);
    notarization.currencystate = completeCurrencyStateToVerus(notarization.currencystate);
    notarization.hashprevnotarizationobject = util.removeHexLeader(notarization.hashprevnotarization);
    delete notarization.hashprevnotarization;

    notarization.prevnotarizationtxid = util.removeHexLeader(notarization.prevnotarization.hash);
    notarization.prevnotarizationout = notarization.prevnotarization.n;
    delete notarization.prevnotarization;

    let tempcurr = []
    for (let i = 0; i < notarization.currencystates.length; i++)
    {
        let tempcurrname = util.uint160ToVAddress(notarization.currencystates[i].currencyid, constants.IADDRESS);
        let currencyItem = {};
        currencyItem[tempcurrname] = completeCurrencyStateToVerus(notarization.currencystates[i].currencystate);
        tempcurr.push(currencyItem);
    }
    notarization.currencystates = tempcurr;

    let tempProofRoots = [];

    for (let i = 0; i < notarization.proofroots.length; i++)
    {
        let tempProofRoot = {};
        tempProofRoot.version = notarization.proofroots[i].version;
        tempProofRoot.systemid = util.uint160ToVAddress(notarization.proofroots[i].systemid, constants.IADDRESS);
        tempProofRoot.stateroot = util.removeHexLeader(notarization.proofroots[i].stateroot);
        tempProofRoot.blockhash = util.removeHexLeader(notarization.proofroots[i].blockhash);
        tempProofRoot.power = util.removeHexLeader(notarization.proofroots[i].compactpower);
        tempProofRoot.type = notarization.proofroots[i].cprtype;
        tempProofRoot.height = notarization.proofroots[i].rootheight;
        tempProofRoots.push(tempProofRoot);

    }
    notarization.proofroots = tempProofRoots;

    return notarization;

}

exports.createNotarization = createNotarization;
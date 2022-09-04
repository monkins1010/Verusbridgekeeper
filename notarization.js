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

    notarization.proposer.type = notarization.proposer.destinationtype;

    notarization.proposer.address = util.hexAddressToBase58(notarization.proposer.type, notarization.proposer.destinationaddress);
    delete notarization.proposer.destinationtype;
    delete notarization.proposer.destinationaddress;

    notarization.currencyid = util.uint160ToVAddress(notarization.currencyid, constants.IADDRESS);
    notarization.currencystate = completeCurrencyStateToVerus(notarization.currencystate);
    notarization.hashprevnotarizationobject = notarization.hashprevnotarization.slice(3);
    delete notarization.hashprevnotarization;

    notarization.prevnotarizationtxid = notarization.prevnotarization.hash.slice(3);
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
        notarization.proofroots[i].stateroot = notarization.proofroots[i].stateroot.slice(3);
        notarization.proofroots[i].blockhash = notarization.proofroots[i].blockhash.slice(3);
        notarization.proofroots[i].compactpower = notarization.proofroots[i].compactpower.slice(3);
        notarization.proofroots[i].type = notarization.proofroots[i].cprtype;
        notarization.proofroots[i].height = notarization.proofroots[i].rootheight;
        delete notarization.proofroots[i].cprtype;
        delete notarization.proofroots[i].rootheight;

    }

    return notarization;

}

exports.createNotarization = createNotarization;
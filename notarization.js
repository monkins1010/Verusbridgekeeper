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

    if (parseInt(notarization.flags & constants.FLAG_ACCEPTED_MIRROR) == constants.FLAG_ACCEPTED_MIRROR) {
        notarization.ismirror = true;
    }

    if (parseInt(notarization.flags & constants.FLAG_CONTRACT_UPGRADE) == constants.FLAG_CONTRACT_UPGRADE) {
        notarization.contractupgrade = true;
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

    exports.notarizationFlags = notarizationFlags;
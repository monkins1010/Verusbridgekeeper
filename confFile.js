const settings = require('./setup');
const fs = require('fs');
const os = require('os');
const path = require('path');
var ini = require('ini');
const fixPath = require('fix-path');
const VETH = "000b090bec6c9ff28586eb7ed24e77562f0c4667";

const rootPath = function (pbaasFolder, pbaasRoot) {
    let confPath;
    switch (os.platform()) {
        case 'darwin':
            fixPath();
            confPath = `${global.HOME}/Library/Application Support` + pbaasRoot.darwin + pbaasFolder.darwin; // + '/veth.conf';
            break;
        case 'win32':
            confPath = `${global.HOME}` + pbaasRoot.win32 + pbaasFolder.win32; // + '/veth.conf' ;
            confPath = path.normalize(confPath);
            break;
        case 'linux':
            confPath = `${global.HOME}` + pbaasRoot.linux + pbaasFolder.linux; // + '/veth.conf'; 
            break;
    }
    return confPath;
}

exports.loadConfFile = (chainName) => {

    let chaintc = chainName.toUpperCase();
    //const coinDir = settings.coin[chaintc]; // NOT USED
    let Config = settings.INIKeys;
    const pbaasFolder = settings.pbaas[VETH]; //TODO: Make modular
    const pbaasRoot = settings.pbaasRoot[chaintc];
    let rpcconf = {};

    let confPath;

    confPath = rootPath(pbaasFolder, pbaasRoot);

    if (!fs.existsSync(confPath)) {
        fs.mkdirSync(confPath, { recursive: true });
    }

    let _data = {};
    try {
        _data = fs.readFileSync(confPath + '/' + VETH + '.conf', 'utf8');
    } catch (error) {
        if (error.code != 'ENOENT') {
            console.log("Quitting....\n\nError reading file at: ", confPath + "\nError: " + error.message);
            process.exit();
        }
    }

    if (_data.length && fs.existsSync(confPath + '/' + VETH + '.conf')) {
        let _match;

        console.log("(veth.conf) file found at: ", confPath);
        for (const [key, value] of Object.entries(Config)) {

            if (_match = _data.match(`${key}` + '=\\n*(.*)')) {

                if (_match[1] != "empty") {
                    Config[key] = _match[1];
                } else {
                    console.log("Quitting....\n\nEmpty veth.conf file value: ", `${key}:"empty" `);
                    process.exit();
                }
            }
        }
        rpcconf = Config;
    } else {

        let err = fs.writeFileSync(confPath + '/' + VETH + '.conf', "", 'utf8');

        if (err) {
            console.log(err, 'Errror writing veth.conf', err.message);
            process.exit();
        }

        for (const [key, value] of Object.entries(settings.RPCDefault[chaintc])) {
            fs.appendFileSync(confPath + '/' + VETH + '.conf', `${key}=${value}` + "\n");
        }

        let tempvalues = fs.readFileSync(confPath + '/' + VETH + '.conf', 'utf8');
        console.log("Quitting....\n\nPlease check veth.conf file located at: ", path.normalize(confPath + '/' + VETH + '.conf'));
        console.log("Default Values:\n", ini.parse(tempvalues, 'utf-8'))
        process.exit();
    }
    return rpcconf;
}

exports.set_conf = (key, infuraLink, ethContract)=> {

    if (!key && !infuraLink && !ethContract)
    {
        return new Error("No data set, please fill in a form");
    }

    let chaintc = "VRSCTEST";
    const pbaasFolder = settings.pbaas[VETH]; //TODO: Make modular
    const pbaasRoot = settings.pbaasRoot[chaintc];
    confPath = rootPath(pbaasFolder, pbaasRoot);

    let confKeys = settings.RPCDefault[chaintc];
    let _data = {};

    if (key) {
        confKeys.privatekey = key;
    }

    if (infuraLink) {
        confKeys.ethnode = infuraLink;
    }

    if (ethContract) {
        confKeys.upgrademanageraddress = ethContract;
    }

    try {
        _data = fs.readFileSync(confPath + '/' + VETH + '.conf', 'utf8');
    } catch (error) {
        if (error.code === 'ENOENT') {
            let err = fs.writeFileSync(confPath + '/' + VETH + '.conf', "", 'utf8');
        } else {
            throw (error);
        }
    }

    if (_data.length && fs.existsSync(confPath + '/' + VETH + '.conf')) {

        var config = ini.parse(_data)

        if (key) {
            config.privatekey = key;
        }
    
        if (infuraLink) {
            config.ethnode = infuraLink;
        }
    
        if (ethContract) {
            config.upgrademanageraddress = ethContract;
        }
        fs.truncateSync(confPath + '/' + VETH + '.conf', 0);
        for (const [key, value] of Object.entries(config)) {
            fs.appendFileSync(confPath + '/' + VETH + '.conf', `${key}=${value}` + "\n");
        }
        return "Conf file updated";
    }
    else {
        if (!(key && infuraLink && ethContract)) {
            throw new Error("Please fill in all fields");
        }
        for (const [key, value] of Object.entries(confKeys)) {
            fs.appendFileSync(confPath + '/' + VETH + '.conf', `${key}=${value}` + "\n");
        }
        return "Conf file created";
    }
};
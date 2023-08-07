const settings = require('./setup');
const fs = require('fs');
const os = require('os');
const path = require('path');
var ini = require('ini');
const CONSTANTS = require('./constants');

const rootPath = function (chainName, currency) {
    let chaintc = chainName.toUpperCase();
    const pbaasFolder = settings.pbaas[currency]; //TODO: Make modular
    const pbaasRoot = settings.pbaasRoot[chaintc];
    let confPath;

    let homeDir = os.homedir();

    switch (os.platform()) {
        case 'darwin':
            confPath = homeDir + "/Library/Application Support" + pbaasRoot.darwin + pbaasFolder.darwin; // + '/veth.conf';
            break;
        case 'win32':
            confPath = global.HOME + pbaasRoot.win32 + pbaasFolder.win32; // + '/veth.conf' ;
            confPath = path.normalize(confPath);
            break;
        case 'linux':
            confPath = homeDir + pbaasRoot.linux + pbaasFolder.linux; // + '/veth.conf'; 
            break;
    }
    return confPath;
}

const checkConfFileExists = function (chainName) {
    
    let chaintc = chainName.toUpperCase();
    const ID = CONSTANTS.VETHIDHEXREVERSED[chaintc]
    let confPath = rootPath(chainName, ID);

    return fs.existsSync(confPath);
}

const loadConfFile = (chainName) => {

    let chaintc = chainName.toUpperCase();
    const ID =  CONSTANTS.VETHIDHEXREVERSED[chaintc]
    let Config = settings.INIKeys;
    let rpcconf = {};
    let confPath = rootPath(chainName, ID);

    if (!fs.existsSync(confPath)) {
        fs.mkdirSync(confPath, { recursive: true });
    }

    let _data = {};
    try {
        _data = fs.readFileSync(confPath + '/' + ID + '.conf', 'utf8');
    } catch (error) {
        if (error.code != 'ENOENT') {
            console.log("Error reading file at: ", confPath + "\nError: " + error.message);
        }
    }

    if (_data.length && fs.existsSync(confPath + '/' + ID + '.conf')) {
        let _match;

        console.log("(veth.conf) file found at: ", confPath);
        for (const [key, value] of Object.entries(Config)) {

            if (_match = _data.match(`${key}` + '=\\n*(.*)')) {

                if (_match[1] != "empty") {
                    Config[key] = _match[1];
                } else {
                    console.log("Empty veth.conf file value: ", `${key}:"empty" `);
                }
            }
        }
        rpcconf = Config;
    } else {

        let err = fs.writeFileSync(confPath + '/' + ID + '.conf', "", 'utf8');

        if (err) {
            console.log(err, 'Errror writing veth.conf', err.message);

        }

        for (const [key, value] of Object.entries(settings.RPCDefault[chaintc])) {
            fs.appendFileSync(confPath + '/' + ID + '.conf', `${key}=${value}` + "\n");
        }

        let tempvalues = fs.readFileSync(confPath + '/' + ID + '.conf', 'utf8');
        console.log("Quitting....\n\nPlease check veth.conf file located at: ", path.normalize(confPath + '/' + ID + '.conf'));
        console.log("Default Values:\n", ini.parse(tempvalues, 'utf-8'))

    }
    return rpcconf;
}

const set_conf = (key, infuraLink, ethContract, chainName)=> {

    if (!infuraLink && !ethContract)
    {
        return new Error("No data set, please fill in a form");
    }

    if (!checkConfFileExists(chainName))
    {
        loadConfFile(chainName);
    }

    let chaintc = chainName.toUpperCase();
    const ID =  CONSTANTS.VETHIDHEXREVERSED[chaintc]
    confPath = rootPath(chainName, ID);

    let confKeys = settings.RPCDefault[chaintc];
    let _data = {};

    if (key) {
        confKeys.privatekey = key;
    }

    if (infuraLink) {
        confKeys.ethnode = infuraLink;
    }

    if (ethContract) {
        confKeys.delegatorcontractaddress = ethContract;
    }

    try {
        _data = fs.readFileSync(confPath + '/' + ID + '.conf', 'utf8');
    } catch (error) {
        if (error.code === 'ENOENT') {
            let err = fs.writeFileSync(confPath + '/' + ID + '.conf', "", 'utf8');
        } else {
            throw (error);
        }
    }

    if (_data.length && fs.existsSync(confPath + '/' + ID + '.conf')) {

        var config = ini.parse(_data)

        if (key) {
            config.privatekey = key;
        }
    
        if (infuraLink) {
            config.ethnode = infuraLink;
        }
    
        if (ethContract) {
            config.delegatorcontractaddress = ethContract;
        }
        fs.truncateSync(confPath + '/' + ID + '.conf', 0);
        for (const [key, value] of Object.entries(config)) {
            fs.appendFileSync(confPath + '/' + ID + '.conf', `${key}=${value}` + "\n");
        }
        return "Conf file updated";
    }
    else {
        if (!(infuraLink && ethContract)) {
            throw new Error("Please fill in all fields");
        }
        for (const [key, value] of Object.entries(confKeys)) {
            fs.appendFileSync(confPath + '/' + ID + '.conf', `${key}=${value}` + "\n");
        }
        return "Conf file created";
    }
};

exports.set_conf = set_conf;
exports.loadConfFile = loadConfFile;
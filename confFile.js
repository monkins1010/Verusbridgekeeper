const settings = require('./setup');
const fs = require('fs');
const os = require('os');
const path = require('path');
var ini = require('ini');
const CONSTANTS = require('./constants');

const CONFIG_DIRECTORY_MODE = 0o700;
const CONFIG_FILE_MODE = 0o600;

const ensureConfigDirectory = (confPath) => {
    fs.mkdirSync(confPath, { recursive: true, mode: CONFIG_DIRECTORY_MODE });
    if (os.platform() !== 'win32') {
        fs.chmodSync(confPath, CONFIG_DIRECTORY_MODE);
    }
};

const restrictConfigFile = (fullPath) => {
    if (os.platform() !== 'win32' && fs.existsSync(fullPath)) {
        fs.chmodSync(fullPath, CONFIG_FILE_MODE);
    }
};

const writeConfigFile = (fullPath, config) => {
    ensureConfigDirectory(path.dirname(fullPath));
    const content = Object.entries(config)
        .map(([key, value]) => `${key}=${value}`)
        .join('\n') + '\n';

    if (os.platform() === 'win32') {
        fs.writeFileSync(fullPath, content, { encoding: 'utf8', mode: CONFIG_FILE_MODE });
        return;
    }

    const temporaryPath = `${fullPath}.${process.pid}.${Date.now()}.tmp`;
    try {
        fs.writeFileSync(temporaryPath, content, { encoding: 'utf8', mode: CONFIG_FILE_MODE, flag: 'wx' });
        fs.renameSync(temporaryPath, fullPath);
        fs.chmodSync(fullPath, CONFIG_FILE_MODE);
    } finally {
        if (fs.existsSync(temporaryPath)) {
            fs.unlinkSync(temporaryPath);
        }
    }
};

const rootPath = function (chainName, currency) {
    let chaintc = chainName.toUpperCase();
    const pbaasFolder = settings.pbaas[currency]; //TODO: Make modular
    const pbaasRoot = settings.pbaasRoot[chaintc];
    let confPath;

    let homeDir = os.homedir();

    switch (os.platform()) {
        case 'darwin':
            confPath = homeDir + "/Library/Application Support" + pbaasRoot.darwin + pbaasFolder.darwin; 
            break;
        case 'win32':
            confPath = global.HOME + pbaasRoot.win32 + pbaasFolder.win32; 
            confPath = path.normalize(confPath);
            break;
        case 'linux':
            confPath = homeDir + pbaasRoot.linux + pbaasFolder.linux; 
            break;
    }
    return confPath;
}

const getVerusConf = (chainName) => {
    let chaintc = chainName.toUpperCase();
    const vrscFolder = settings.coin[chaintc]; 
    const vrscFile = settings.verusConfFile[chaintc]; 

    let confPath;

    let homeDir = os.homedir();

    switch (os.platform()) {
        case 'darwin':
            confPath = homeDir + "/Library/Application Support" + vrscFolder.darwin + vrscFile;
            break;
        case 'win32':
            confPath = global.HOME + vrscFolder.win32 + vrscFile;
            confPath = path.normalize(confPath);
            break;
        case 'linux':
            confPath = homeDir + vrscFolder.linux + vrscFile;
            break;
    }

    let _data;
    try {
        _data = fs.readFileSync(confPath, 'utf8');
    } catch (error) {
        throw (error);

    }

    if (!_data.length) { 
        throw (new Error("No data in veth.conf file"));
    }

    var config = ini.parse(_data);

    return config;

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
    let Config = { ...settings.INIKeys };
    let rpcconf = {};
    let confPath = rootPath(chainName, ID);
    const fullPath = path.join(confPath, `${ID}.conf`);

    ensureConfigDirectory(confPath);
    restrictConfigFile(fullPath);

    let _data = {};
    try {
        _data = fs.readFileSync(fullPath, 'utf8');
    } catch (error) {
        if (error.code != 'ENOENT') {
            console.log("Error reading file at: ", confPath + "\nError: " + error.message);
        }
    }

    if (_data.length && fs.existsSync(fullPath)) {
        let _match;

        console.log("(veth.conf) file found at: ", confPath);
        for (const [key, value] of Object.entries(Config)) {

            if (_match = _data.match(new RegExp(`^${key}=\\n*(.*)`, 'm'))) {

                if (_match[1] == "empty") {
                    console.log("Empty veth.conf file value: ", `${key}:"empty" `);
                } else {
                    Config[key] = _match[1];
                }
            }
        }
        rpcconf = Config;
    } else {
        writeConfigFile(fullPath, settings.RPCDefault[chaintc]);

        let tempvalues = fs.readFileSync(fullPath, 'utf8');
        console.log("Quitting....\n\nPlease check veth.conf file located at: ", path.normalize(fullPath));
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
    const confPath = rootPath(chainName, ID);
    const fullPath = path.join(confPath, `${ID}.conf`);
    ensureConfigDirectory(confPath);
    restrictConfigFile(fullPath);

    let confKeys = { ...settings.RPCDefault[chaintc] };
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
        _data = fs.readFileSync(fullPath, 'utf8');
    } catch (error) {
        if (error.code !== 'ENOENT') {
            throw (error);
        }
    }

    if (_data.length && fs.existsSync(fullPath)) {

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
        writeConfigFile(fullPath, config);
        return "Conf file updated";
    }
    else {
        if (!(infuraLink && ethContract)) {
            throw new Error("Please fill in all fields");
        } else if (infuraLink.slice(0,4) === "http") {
            throw new Error("Please use the wws:// protocol for the Eth node");
        }
        writeConfigFile(fullPath, confKeys);
        return "Conf file created";
    }
};

const set_conf_values = (chainName, updates) => {
    let chaintc = chainName.toUpperCase();
    const ID = CONSTANTS.VETHIDHEXREVERSED[chaintc];
    let confPath = rootPath(chainName, ID);
    let fullPath = confPath + '/' + ID + '.conf';

    ensureConfigDirectory(confPath);
    restrictConfigFile(fullPath);

    let _data = "";
    try {
        _data = fs.readFileSync(fullPath, 'utf8');
    } catch (error) {
        if (error.code !== 'ENOENT') {
            throw error;
        }
    }

    let config = _data.length ? ini.parse(_data) : {};
    for (const [key, value] of Object.entries(updates || {})) {
        config[key] = value;
    }

    writeConfigFile(fullPath, config);
};

exports.set_conf = set_conf;
exports.loadConfFile = loadConfFile;
exports.getVerusConf = getVerusConf;
exports.set_conf_values = set_conf_values;

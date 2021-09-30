const settings = require('./setup'); 
const fs = require('fs');
const os = require('os');
const path = require('path');
var ini = require('ini')

exports.loadConfFile = (chainName) => {

    let chaintc = chainName.toUpperCase();
    //const coinDir = settings.coin[chaintc]; // NOT USED
    let Config = settings.INIKeys;
    const pbaasFolder = settings.pbaas["VETH"];  //TODO: Make modular
    const pbaasRoot = settings.pbaasRoot[chaintc];
    let rpcconf = {}; 

    let confPath;
    
    switch (os.platform()){
        case 'darwin':
            confPath = "/Library/Application Support" + pbaasRoot.darwin + pbaasFolder.darwin; // + '/veth.conf';
            break;
        case 'win32':
            confPath =  `${global.HOME}` + pbaasRoot.win32 + pbaasFolder.win32; // + '/veth.conf' ;
            confPath = path.normalize(confPath);
            break;
        case 'linux':
            confPath =  `${global.HOME}` + pbaasRoot.linux + pbaasFolder.linux; // + '/veth.conf'; 
            break;
    }
    
    

    if (!fs.existsSync(confPath)){
        fs.mkdirSync(confPath, { recursive: true });
    }

    let _data = {};
    try{
        _data = fs.readFileSync(confPath + '/veth.conf' , 'utf8');
    }catch(error){
        if(error.code != 'ENOENT'){
        console.log("Quitting....\n\nError reading file at: ",confPath + "\nError: " + error.message );
        process.exit();
        }
    }

    if (_data.length && fs.existsSync(confPath + '/veth.conf') ) {
        let _match;
     
        console.log("(veth.conf) file found at: ",confPath);
        for(const [key, value] of Object.entries(Config)){

            if (_match = _data.match(`${key}` + '=\\n*(.*)')) {

                if(_match[1] != "empty"){
                    Config[key] = _match[1];
                }
                else {
                    console.log("Quitting....\n\nEmpty veth.conf file value: ",`${key}:"empty" ` );
                    process.exit();
                }
            }
        }
        rpcconf = Config;
    } else {

        let err = fs.writeFileSync(confPath+ '/veth.conf',"", 'utf8');

        if (err){
            console.log(err, 'Errror writing veth.conf', err.message);
            process.exit();
        }

        for(const [key, value] of Object.entries(settings.RPCDefault[chaintc])){
            fs.appendFileSync(confPath + '/veth.conf', `${key}=${value}`+ "\n");
            }

        let tempvalues = fs.readFileSync(confPath + '/veth.conf' , 'utf8');
        console.log("Quitting....\n\nPlease check veth.conf file located at: ",path.normalize(confPath + '/veth.conf') );
        console.log("Default Values:\n",ini.parse(tempvalues,'utf-8') )
        process.exit();
    }
    return rpcconf;
}
const http = require('http');
const os = require('os');
global.HOME = os.platform() === "win32" ? process.env.APPDATA : process.env.HOME;
let ethInteractor = require('./ethInteractor.js');
let checkAPI = require('./apiFunctions.js');
const confFile = require('./confFile.js');
let RPCDetails;
let log = function(){};;

function processPost(request, response, callback) {
    var queryData = "";
    if (typeof callback !== 'function') return null;

    if (request.method == 'POST') {
        request.on('data', function(data) {
            queryData += data;
            if (queryData.length > 1e6) {
                queryData = "";
                response.writeHead(413, { 'Content-Type': 'text/plain' }).end();
                request.connection.destroy();
            }
        });

        request.on('end', function() {
            request.post = queryData;
            callback();
        });

    } else {
        response.writeHead(405, { 'Content-Type': 'text/plain' });
        response.end();
    }
}

let rollingBuffer = [];

const bridgeKeeperServer = http.createServer((request, response) => {
    const userpass = Buffer.from(
        (request.headers.authorization || '').split(' ')[1] || '',
        'base64'
    ).toString();

    var ip = request.headers['x-forwarded-for'] || request.connection.remoteAddress;
    
    if (ip.startsWith('::ffff:')) {
        ip = ip.substring(7);
    }

    if (userpass !== RPCDetails.userpass || ip != RPCDetails.ip) {
        response.writeHead(401, { 'WWW-Authenticate': 'Basic realm="nope"' });
        response.end('HTTP Error 401 Unauthorized: Access is denied');
        return;
    }
    if(request.method == 'POST') {
        processPost(request, response, function() {

            if (request.post) {
                response.writeHead(200, "OK", { 'Content-Type': 'application/json' });

                try
                {
                    let postData = JSON.parse(request.post);
                    let command = postData.method;
                    const event = new Date(Date.now());

                    if (command != "getinfo" && command != "getcurrency")
                    {
                        log("Command: " + command);
                        rollingBuffer.push(event.toLocaleString() + " Command: " + command);
                    }

                    if (rollingBuffer.length > 20)
                        rollingBuffer = rollingBuffer.slice(rollingBuffer.length - 20, 20);
                    Promise.race([
                            ethInteractor[checkAPI.APIs(command)](postData.params),
                            new Promise((resolve, reject) => {
                              setTimeout(() => {
                                reject(new Error('Timeout'));
                              }, 60000);
                            })
                          ])
                          .then((returnData) => {
                            response.write(JSON.stringify(returnData));
                            response.end();
                            if (returnData.result?.error) {
                              rollingBuffer.push("Error: " + returnData.result?.message);
                            }
                          })
                          .catch((error) => {
                            if (error.message === 'Timeout') {
                                response.writeHead(500, "Error", { 'Content-Type': 'application/json' });
                                response.end();
                            } else {
                                response.writeHead(500, "Error", { 'Content-Type': 'application/json' });
                                response.end();
                            }
                    });
                } catch (e)
                {
                    response.writeHead(500, "Error", { 'Content-Type': 'application/json' });
                    response.end();
                    rollingBuffer.push("Error: " + e.message);
                }
            }
        });
    } else {
        response.writeHead(200, "OK", { 'Content-Type': 'application/json' });
        response.end();
    }
});

exports.status = function() {
    const serverstatus = bridgeKeeperServer.listening;
    return {serverrunning: serverstatus , logs: rollingBuffer};   
}

/**
 * Starts bridgekeeper
 * @param {{ ticker: string, debug?: boolean, debugsubmit?: boolean, debugnotarization?: boolean, noimports?: boolean, checkhash?: boolean }} config
 */
exports.start = async function(config) {
    try{
        const port = await ethInteractor.init(config);

        RPCDetails = {userpass: ethInteractor.InteractorConfig._userpass, ip: ethInteractor.InteractorConfig._rpcallowip};
        log = ethInteractor.InteractorConfig._consolelog ? console.log : function(){};;
        bridgeKeeperServer.listen(port);
        console.log(`Bridgekeeper Started listening on port: ${port}`);
        rollingBuffer.push(`Bridgekeeper Started listening on port: ${port}`);
        return true;
    } catch (error){
        console.error(error)
        return error;
    }
}

exports.stop = function() {
    try{
        ethInteractor.end();
        bridgeKeeperServer.close();
        rollingBuffer.push(new Date(Date.now()).toLocaleString() + ` - Bridgekeeper Stopped`);
        return true;
    } catch (error){
        return error;
    }
}

exports.set_conf = function(key, infuraLink, ethContract, chainName) {
    try{
        const reply = confFile.set_conf(key, infuraLink, ethContract, chainName);
        return reply;
    } catch (error){
        throw (error);
    }
}

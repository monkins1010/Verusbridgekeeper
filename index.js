const http = require('http');
const async = require('async');
const os = require('os');
global.HOME = os.platform() === "win32" ? process.env.APPDATA : process.env.HOME;
let ethInteractor = require('./ethInteractor.js');
let checkAPI = require('./apiFunctions.js');
const confFile = require('./confFile.js');
let RPCDetails;
let log = function () { };

const SERVER_OFF = 0;
const SERVER_OK = 1;
const SERVER_RPC_FAULT = 2;
const SERVER_WEBSOCKET_FAULT = 3;

function processPost(request, response, callback) {
    var queryData = "";
    if (typeof callback !== 'function') return null;

    if (request.method == 'POST') {
        request.on('data', function (data) {
            queryData += data;
            if (queryData.length > 1e6) {
                queryData = "";
                response.writeHead(413, { 'Content-Type': 'text/plain' }).end();
                request.connection.destroy();
            }
        });

        request.on('end', function () {
            request.post = queryData;
            callback();
        });

    } else {
        response.writeHead(405, { 'Content-Type': 'text/plain' });
        response.end();
    }
}

let rollingBuffer = [];

const queue = async.queue(async (task, callback) => {

    const { request, response } = task;
    await processData(request, response);
    callback();
}, 1); // set concurrency to 1 to process tasks one at a time

const processData = async (request, response) => {
    if (request.post) {
        let responseSent = false;
        
        // 5 second timeout to ensure response is always sent
        const timeoutId = setTimeout(() => {
            if (!responseSent) {
                responseSent = true;
                console.log("HTTP Request timeout - forcing response");
                try {
                    response.writeHead(504, "Gateway Timeout", { 'Content-Type': 'application/json' });
                    response.write(JSON.stringify({ result: { error: true, message: "Request timeout" } }));
                    response.end();
                } catch (e) {
                    // Response may already be partially sent
                }
                rollingBuffer.push(new Date(Date.now()).toLocaleString() + " Error: HTTP Request timeout");
            }
        }, 5000);

        try {
            let postData = JSON.parse(request.post);
            let command = postData.method;
            const event = new Date(Date.now());

            if (command != "getinfo" && command != "getcurrency") {
                log("Command: " + command);
                rollingBuffer.push(event.toLocaleString() + " Command: " + command);
            }

            if (rollingBuffer.length > 20)
                rollingBuffer = rollingBuffer.slice(rollingBuffer.length - 20, 20);

            const returnData = await Promise.race([
                ethInteractor[checkAPI.APIs(command)](postData.params),
                new Promise((resolve, reject) => {
                    setTimeout(() => {
                        reject(new Error('Websocket connection Timeout'));
                    }, 15000);
                })
            ])

            if (!responseSent) {
                responseSent = true;
                clearTimeout(timeoutId);
                
                if (returnData?.result?.error) {
                    response.writeHead(402, "Error", { 'Content-Type': 'application/json' });
                    response.write(JSON.stringify(returnData));
                    response.end();
                } else {
                    response.writeHead(200, "OK", { 'Content-Type': 'application/json' });
                    response.write(JSON.stringify(returnData));
                    response.end();
                }
            }
 
        } catch (e) {
            if (!responseSent) {
                responseSent = true;
                clearTimeout(timeoutId);
                response.writeHead(500, "Error", { 'Content-Type': 'application/json' });
                response.write(JSON.stringify({ result: { error: true, message: e.message || "Unknown error" } }));
                response.end();
                rollingBuffer.push(new Date(Date.now()).toLocaleString() + " Error: " + (e.message ? e.message : e));
            }
        }
    }
}

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
    if (request.method == 'POST') {
        processPost(request, response, function () {

            queue.push({ request, response }, function (err) { });
        });
    } else {
        response.writeHead(200, "OK", { 'Content-Type': 'application/json' });
        response.end();
    }
});

exports.status = async function () {
    let serverstatus = bridgeKeeperServer.listening;
    let websocketOk = false;

    try {
        websocketOk = await ethInteractor.web3status();
    } catch (error) {
        websocketOk = false;
        rollingBuffer.push(new Date(Date.now()).toLocaleString() + "Connection error: " + error.message);
    }

    let status;

    if (!serverstatus) {
        status = SERVER_OFF;
    } else if (serverstatus && websocketOk) { 
        status = SERVER_OK;
    } else if (serverstatus && !websocketOk) {
        status = SERVER_WEBSOCKET_FAULT;
    }

    return { serverrunning: status, logs: rollingBuffer };
}

/**
 * Starts bridgekeeper
 * @param {{ ticker: string, debug?: boolean, debugsubmit?: boolean, debugnotarization?: boolean, noimports?: boolean, checkhash?: boolean }} config
 */
exports.start = async function (config) {
    try {
        const port = await ethInteractor.init(config);

        RPCDetails = { userpass: ethInteractor.InteractorConfig._userpass, ip: ethInteractor.InteractorConfig._rpcallowip };
        log = ethInteractor.InteractorConfig._consolelog ? console.log : function () { };;
        bridgeKeeperServer.listen(port);
        console.log(`Bridgekeeper Started listening on port: ${port}`);
        rollingBuffer.push(`Bridgekeeper Started listening on port: ${port}`);
        return true;
    } catch (error) {
        console.error(error)
        return error;
    }
}

exports.stop = function () {
    try {
        ethInteractor.end();
        bridgeKeeperServer.close();
        rollingBuffer.push(new Date(Date.now()).toLocaleString() + ` - Bridgekeeper Stopped`);
        return true;
    } catch (error) {
        return error;
    }
}

exports.set_conf = function (key, infuraLink, ethContract, chainName) {
    try {
        const reply = confFile.set_conf(key, infuraLink, ethContract, chainName);
        return reply;
    } catch (error) {
        throw (error);
    }
}

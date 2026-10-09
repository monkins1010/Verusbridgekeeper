const http = require('http');
const crypto = require('crypto');
const async = require('async');
const JSONbig = require('json-bigint')({ storeAsString: true });
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
const RPC_TIMEOUT_MS = 15000;
// Mutators return as soon as the tx hash is known; this hard cap only stops a dead provider
// from wedging the queue. The daemon allows mutators 60 s (15 s for everything else), so stay within that.
const MUTATING_RPC_TIMEOUT_MS = 60000;
const MUTATING_RPC_METHODS = new Set([
    'submitimports',
    'approveorrejectacceptedimport',
    'submitacceptednotarization',
    'revokeidentity',
    'stop'
]);

function pushLog(line) {
    rollingBuffer.push(line);
    if (rollingBuffer.length > 20)
        rollingBuffer = rollingBuffer.slice(-20);
}

function sendResponse(task, statusCode, statusMessage, body) {
    if (task.responseSent) {
        return false;
    }

    task.responseSent = true;
    clearTimeout(task.timeoutId);
    try {
        task.response.writeHead(statusCode, statusMessage, { 'Content-Type': 'application/json' });
        task.response.write(JSON.stringify(body));
        task.response.end();
        return true;
    } catch (error) {
        return false;
    }
}

function armTimeout(task, timeoutMs) {
    task.timeout = new Promise(resolve => {
        task.timeoutId = setTimeout(() => {
            if (sendResponse(task, 504, 'Gateway Timeout', { result: { error: true, message: 'Request timeout' } })) {
                console.log('HTTP Request timeout - forcing response');
                pushLog(new Date(Date.now()).toLocaleString() + ' Error: HTTP Request timeout');
            }
            resolve();
        }, timeoutMs);
    });
}

function createQueuedTask(request, response) {
    const task = { request, response, responseSent: false, timeoutId: null, timeout: null, postData: null, parseError: null };

    try {
        task.postData = JSONbig.parse(request.post);
    } catch (error) {
        task.parseError = error;
    }

    task.mutating = MUTATING_RPC_METHODS.has(task.postData?.method);
    // Read-only calls time out from enqueue. Mutators are timed from when processing starts,
    // so waiting behind other calls never turns a submission into a 504.
    if (!task.mutating) {
        armTimeout(task, RPC_TIMEOUT_MS);
    }
    return task;
}

const queue = async.queue(async (task) => {

    await processData(task);
}, 1); // set concurrency to 1 to process tasks one at a time

const processData = async (task) => {
    const { request } = task;
    if (request.post && !task.responseSent) {
        try {
            if (task.parseError) {
                throw task.parseError;
            }
            if (task.mutating) {
                armTimeout(task, MUTATING_RPC_TIMEOUT_MS);
            }

            let postData = task.postData;
            let command = postData.method;
            const event = new Date(Date.now());

            if (command != "getinfo" && command != "getcurrency") {
                log("Command: " + command);
                pushLog(event.toLocaleString() + " Command: " + command);
            }

            const interactorCall = ethInteractor[checkAPI.APIs(command)](postData.params);
            const returnData = await Promise.race([interactorCall, task.timeout]);

            if (!task.responseSent) {
                if (returnData?.result?.error) {
                    sendResponse(task, 402, 'Error', returnData);
                } else {
                    sendResponse(task, 200, 'OK', returnData);
                }
            }
 
        } catch (e) {
            if (!task.responseSent) {
                sendResponse(task, 500, 'Error', { result: { error: true, message: e.message || 'Unknown error' } });
                pushLog(new Date(Date.now()).toLocaleString() + " Error: " + (e.message ? e.message : e));
            }
        }
    }
}

function safeEqual(a, b) {
    // hash first so lengths match and the compare is constant-time
    const ha = crypto.createHash('sha256').update(String(a)).digest();
    const hb = crypto.createHash('sha256').update(String(b)).digest();
    return crypto.timingSafeEqual(ha, hb);
}

function normalizeRemoteAddress(address) {
    if (address === '::1') {
        return '127.0.0.1';
    }
    if (address && address.startsWith('::ffff:')) {
        return address.substring(7);
    }

    return address;
}

const bridgeKeeperServer = http.createServer((request, response) => {
    const userpass = Buffer.from(
        (request.headers.authorization || '').split(' ')[1] || '',
        'base64'
    ).toString();

    const ip = normalizeRemoteAddress(request.socket.remoteAddress);

    if (!safeEqual(userpass, RPCDetails.userpass) || ip != RPCDetails.ip) {
        response.writeHead(401, { 'WWW-Authenticate': 'Basic realm="nope"' });
        response.end('HTTP Error 401 Unauthorized: Access is denied');
        return;
    }
    if (request.method == 'POST') {
        processPost(request, response, function () {
            const task = createQueuedTask(request, response);
            if (!request.post.trim()) {
                sendResponse(task, 400, 'Bad Request', { result: { error: true, message: 'Request body is required' } });
                return;
            }

            queue.push(task, function (err) { });
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
        pushLog(new Date(Date.now()).toLocaleString() + "Connection error: " + error.message);
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
 * @param {{ ticker: string, debug?: boolean, debugsubmit?: boolean, debugnotarization?: boolean, noimports?: boolean, checkhash?: boolean, runtimeSettings?: object }} config
 */
exports.start = async function (config) {
    const port = await ethInteractor.init(config);

    RPCDetails = {
        userpass: ethInteractor.InteractorConfig._userpass,
        host: ethInteractor.InteractorConfig._rpchost,
        ip: ethInteractor.InteractorConfig._rpcallowip
    };
    log = ethInteractor.InteractorConfig._consolelog ? console.log : function () { };;

    await new Promise((resolve, reject) => {
        const onError = (error) => {
            bridgeKeeperServer.removeListener('listening', onListening);
            reject(error);
        };
        const onListening = () => {
            bridgeKeeperServer.removeListener('error', onError);
            resolve();
        };

        bridgeKeeperServer.once('error', onError);
        bridgeKeeperServer.once('listening', onListening);
        if (RPCDetails.host) {
            bridgeKeeperServer.listen(port, RPCDetails.host);
        } else {
            bridgeKeeperServer.listen(port);
        }
    });

    console.log(`Bridgekeeper Started listening on port: ${port}`);
    pushLog(`Bridgekeeper Started listening on port: ${port}`);
    return true;
}

exports.stop = function () {
    try {
        ethInteractor.end();
        bridgeKeeperServer.close();
        pushLog(new Date(Date.now()).toLocaleString() + ` - Bridgekeeper Stopped`);
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
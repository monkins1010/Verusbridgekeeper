const http = require('http');
const os = require('os');
global.HOME = os.platform() === "win32" ? process.env.APPDATA : process.env.HOME;
let ethInteractor = require('./ethInteractor.js');
let checkAPI = require('./apiFunctions.js');
const confFile = require('./confFile.js');

function processPost(request, response, callback) {
    var queryData = "";
    if (typeof callback !== 'function') return null;
    // console.log("\x1b[35m", "incoming connection");

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
    if(request.method == 'POST') {
        processPost(request, response, function() {
            //handle the post request based upon the url
            //let parsedUrl = url.parse(request.url);
            //trim the leading slash

            if (request.post) {
                response.writeHead(200, "OK", { 'Content-Type': 'application/json' });

                try
                {
                    let postData = JSON.parse(request.post);
                    let command = postData.method;
                    const event = new Date(Date.now());

                    if (command != "getinfo" && command != "getcurrency")
                    {
                        console.log("Command: " + command);
                        rollingBuffer.push(event.toLocaleString() + " Command: " + command);
                    }

                    if (rollingBuffer.length > 20)
                        rollingBuffer = rollingBuffer.slice(rollingBuffer.length - 20, 20);

                    ethInteractor[checkAPI.APIs(command)](postData.params).then((returnData) => {
                        response.write(JSON.stringify(returnData));
                        response.end();
                        if (returnData.result?.error)
                        {
                            rollingBuffer.push("Error: " + returnData.result?.message);
                        }
                    });
                } catch (e)
                {
                    response.end();
                    rollingBuffer.push("Error: " + e);

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
        bridgeKeeperServer.listen(port);
        console.log(`Bridgekeeper Started listening on port: ${port}`);
        return true;
    } catch (error){
        console.error(error)

        return error;
    }

}

exports.stop = function() {
    try{
        bridgeKeeperServer.close();
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

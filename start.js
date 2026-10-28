const server = require('./index');
const start = async (config) =>
{
    try{
        await server.start(config);
    } catch (e)
    {
        console.log("Bridgekeeper failed to start: " + (e && e.message ? e.message : e));
        process.exit(1);
    }
}

start();
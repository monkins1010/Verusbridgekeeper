const server = require('./index');
const start = (config) => 
{
    try{
        server.start(config);
    } catch (e)
    {
        console.log(e);
    }
} 

start();
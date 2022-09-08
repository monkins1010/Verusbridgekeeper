const server = require('./index');
const start = () => 
{
    try{
    server.start();
    } catch (e)
    {
        console.log(e);
    }
} 

start();
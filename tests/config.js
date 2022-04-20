const axios = require('axios');

axios.defaults.withCredentials = true;

const vrsctest = axios.create({
    baseURL: "http://localhost:25779/", //process.env.VRSCTEST_RPC_URL,
    auth: {
        username: "user3920459605", //process.env.VRSCTEST_RPC_USER || '',
        password: "pass7d37f4a970807bc7f65b511a04e6ff5d0763544283a253faecdeae6d522bdf6917", // process.env.VRSCTEST_RPC_PASSWORD || '',
    }
});

const verusClient = {
    vrsctest,
    // add more verus pbaas chain clients here
}

exports.verusClient = verusClient;
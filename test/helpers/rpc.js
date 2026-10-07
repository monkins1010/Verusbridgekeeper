'use strict';
const http = require('node:http');
const net = require('node:net');

const freePort = () => new Promise((resolve) => {
    const s = net.createServer().listen(0, '127.0.0.1', () => { const p = s.address().port; s.close(() => resolve(p)); });
});

/** POSTs a JSON-RPC style body to the bridgekeeper and resolves { status, body }. */
function post(port, userpass, body, { auth = userpass, raw = false } = {}) {
    return new Promise((resolve, reject) => {
        const payload = raw ? body : JSON.stringify(body);
        const headers = { 'Content-Type': 'application/json', 'Content-Length': Buffer.byteLength(payload) };
        if (auth !== null) headers.Authorization = 'Basic ' + Buffer.from(auth).toString('base64');
        const req = http.request({ host: '127.0.0.1', port, method: 'POST', headers }, (res) => {
            let data = '';
            res.on('data', (c) => { data += c; });
            res.on('end', () => {
                let parsed = null;
                try { parsed = data ? JSON.parse(data) : null; } catch (e) { parsed = null; }
                resolve({ status: res.statusCode, body: parsed });
            });
        });
        req.on('error', reject);
        req.end(payload);
    });
}

module.exports = { freePort, post };

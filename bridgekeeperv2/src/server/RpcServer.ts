/**
 * RpcServer — HTTP RPC server with Basic Auth and serial request queue.
 * Replaces the http.createServer + async.queue from the original index.js.
 */

import * as http from 'http';
import { RpcRouter } from './RpcRouter';
import { IServerConfig, IRpcRequest, IRpcResponse } from './types';

/** Rolling buffer for recent log entries */
const MAX_LOG_ENTRIES = 20;

export class RpcServer {
    private server: http.Server;
    private router: RpcRouter;
    private config: IServerConfig;
    private logs: string[] = [];
    private queue: Array<{
        request: http.IncomingMessage;
        response: http.ServerResponse;
        body: string;
    }> = [];
    private processing = false;

    constructor(router: RpcRouter, config: IServerConfig) {
        this.router = router;
        this.config = config;
        this.server = http.createServer(this.handleRequest.bind(this));
    }

    /** Start listening on the configured port */
    listen(): Promise<void> {
        return new Promise((resolve) => {
            this.server.listen(this.config.port, () => {
                this.addLog(`Bridgekeeper started listening on port: ${this.config.port}`);
                resolve();
            });
        });
    }

    /** Stop the server */
    close(): Promise<void> {
        return new Promise((resolve, reject) => {
            this.server.close((err) => {
                if (err) reject(err);
                else {
                    this.addLog('Bridgekeeper stopped');
                    resolve();
                }
            });
        });
    }

    /** Whether the server is listening */
    get isListening(): boolean {
        return this.server.listening;
    }

    /** Recent log entries */
    get recentLogs(): string[] {
        return [...this.logs];
    }

    /** Handle incoming HTTP requests — auth + method check + body parsing */
    private handleRequest(req: http.IncomingMessage, res: http.ServerResponse): void {
        // Auth check
        const authHeader = req.headers.authorization || '';
        const userpass = Buffer.from(authHeader.split(' ')[1] || '', 'base64').toString();

        let ip = req.headers['x-forwarded-for'] as string || req.socket.remoteAddress || '';
        if (ip.startsWith('::ffff:')) {
            ip = ip.substring(7);
        }

        if (userpass !== this.config.userpass || ip !== this.config.allowIp) {
            res.writeHead(401, { 'WWW-Authenticate': 'Basic realm="nope"' });
            res.end('HTTP Error 401 Unauthorized: Access is denied');
            return;
        }

        if (req.method !== 'POST') {
            res.writeHead(200, 'OK', { 'Content-Type': 'application/json' });
            res.end();
            return;
        }

        // Collect POST body
        let body = '';
        req.on('data', (chunk: Buffer) => {
            body += chunk;
            if (body.length > 1e6) {
                body = '';
                res.writeHead(413, { 'Content-Type': 'text/plain' });
                res.end();
                req.socket.destroy();
            }
        });

        req.on('end', () => {
            this.enqueue(req, res, body);
        });
    }

    /** Add a request to the serial processing queue */
    private enqueue(
        request: http.IncomingMessage,
        response: http.ServerResponse,
        body: string,
    ): void {
        this.queue.push({ request, response, body });
        this.processQueue();
    }

    /** Process queued requests one at a time */
    private async processQueue(): Promise<void> {
        if (this.processing) return;
        this.processing = true;

        while (this.queue.length > 0) {
            const task = this.queue.shift()!;
            await this.processRequest(task.response, task.body);
        }

        this.processing = false;
    }

    /** Process a single RPC request with timeout protection */
    private async processRequest(
        response: http.ServerResponse,
        body: string,
    ): Promise<void> {
        let responseSent = false;
        const timeoutMs = this.config.requestTimeoutMs ?? 20_000;

        const timeoutId = setTimeout(() => {
            if (!responseSent) {
                responseSent = true;
                this.addLog('Error: HTTP Request timeout');
                try {
                    response.writeHead(504, 'Gateway Timeout', { 'Content-Type': 'application/json' });
                    response.write(JSON.stringify({ result: { error: true, message: 'Request timeout' } }));
                    response.end();
                } catch {
                    // Response may already be partially sent
                }
            }
        }, timeoutMs);

        try {
            const rpcRequest: IRpcRequest = JSON.parse(body);
            const method = rpcRequest.method;

            if (method !== 'getinfo' && method !== 'getcurrency') {
                this.addLog(`Command: ${method}`);
            }

            // Race the handler against a 15s timeout
            const result = await Promise.race([
                this.router.dispatch(method, rpcRequest.params),
                new Promise<never>((_, reject) => {
                    setTimeout(() => reject(new Error('Websocket connection Timeout')), 15_000);
                }),
            ]);

            if (!responseSent) {
                responseSent = true;
                clearTimeout(timeoutId);
                const rpcResponse = result as IRpcResponse;

                if (rpcResponse.error) {
                    response.writeHead(402, 'Error', { 'Content-Type': 'application/json' });
                } else {
                    response.writeHead(200, 'OK', { 'Content-Type': 'application/json' });
                }
                response.write(JSON.stringify(rpcResponse));
                response.end();
            }
        } catch (err: unknown) {
            if (!responseSent) {
                responseSent = true;
                clearTimeout(timeoutId);
                const message = err instanceof Error ? err.message : 'Unknown error';
                this.addLog(`Error: ${message}`);
                response.writeHead(500, 'Error', { 'Content-Type': 'application/json' });
                response.write(JSON.stringify({ result: { error: true, message } }));
                response.end();
            }
        }
    }

    /** Add a timestamped log entry to the rolling buffer */
    private addLog(message: string): void {
        const timestamp = new Date().toLocaleString();
        this.logs.push(`${timestamp} ${message}`);
        if (this.logs.length > MAX_LOG_ENTRIES) {
            this.logs = this.logs.slice(-MAX_LOG_ENTRIES);
        }
    }
}

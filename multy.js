const WebSocket = require('ws');
const fs = require('fs/promises');
const HttpsProxyAgent = require('https-proxy-agent');
const readline = require('readline');

async function readFile(filePath) {
    try {
        const data = await fs.readFile(filePath, 'utf-8');
        return data.split('\n').map(line => line.trim()).filter(line => line);
    } catch (error) {
        console.error('❌ Error reading file:', error.message);
        return [];
    }
}

// Token ကို Hide လုပ်မယ့် Function
function maskToken(token) {
    return token.slice(0, 6) + "..." + token.slice(-6);
}

const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout
});

class WebSocketClient {
    constructor(token, proxy = null) {
        this.token = token;
        this.proxy = proxy;
        this.socket = null;
        this.pingInterval = null;
        this.reconnectAttempts = 0;
        this.wsUrl = "wss://secure.ws.teneo.pro";
        this.version = "v0.2";
        this.email = "Unknown"; // Default Name
    }

    async connect() {
        const maskedToken = maskToken(this.token);
        console.log(`🔗 Connecting WebSocket... | Token: ${maskedToken}`);

        const wsUrl = `${this.wsUrl}/websocket?accessToken=${encodeURIComponent(this.token)}&version=${encodeURIComponent(this.version)}`;
        const options = this.proxy ? { agent: new HttpsProxyAgent(this.proxy) } : {};
        this.socket = new WebSocket(wsUrl, options);

        this.socket.onopen = () => {
            console.log(`✅ Connected as ${this.email} | Token: ${maskedToken}`);
            this.reconnectAttempts = 0;
            this.startPinging();
            this.socket.send(JSON.stringify({ type: "IDENTIFY", token: this.token })); // Account Data ရယူရန်
        };

        this.socket.onmessage = (event) => {
            try {
                const data = JSON.parse(event.data);
                if (data.user && data.user.email) {
                    this.email = data.user.email;
                    console.log(`📩 Account Identified: ${this.email} | Token: ${maskedToken}`);
                }
                console.log(`📩 Response for ${this.email}:`, data);
            } catch (error) {
                console.error(`⚠️ Error parsing message for ${this.email}:`, error.message);
            }
        };

        this.socket.onclose = () => {
            console.log(`❌ Disconnected: ${this.email} | Token: ${maskedToken}`);
            this.stopPinging();
            this.reconnect();
        };

        this.socket.onerror = (error) => {
            console.error(`⚠️ WebSocket error for ${this.email} | Token: ${maskedToken}:`, error.message);
        };
    }

    reconnect() {
        const delay = Math.min(1000 * 2 ** this.reconnectAttempts, 30000);
        console.log(`🔄 Reconnecting in ${delay / 1000} seconds...`);
        setTimeout(() => {
            this.reconnectAttempts++;
            this.connect();
        }, delay);
    }

    disconnect() {
        if (this.socket) {
            this.socket.close();
            this.socket = null;
            this.stopPinging();
        }
    }

    startPinging() {
        this.stopPinging();
        this.pingInterval = setInterval(() => {
            if (this.socket && this.socket.readyState === WebSocket.OPEN) {
                this.socket.send(JSON.stringify({ type: "PING" }));
                console.log(`📡 Ping sent at ${new Date().toISOString()}`);
            }
        }, 10000); // 10 seconds
    }

    stopPinging() {
        if (this.pingInterval) {
            clearInterval(this.pingInterval);
            this.pingInterval = null;
        }
    }
}

async function main() {
    try {
        const tokens = await readFile('tokens.txt');
        rl.question('🛡 Do you want to use a proxy? (y/n): ', async (useProxyAnswer) => {
            let useProxy = useProxyAnswer.toLowerCase() === 'y';
            let proxies = [];

            if (useProxy) {
                proxies = await readFile('proxies.txt');
            }

            if (tokens.length > 0) {
                const wsClients = [];

                for (let i = 0; i < tokens.length; i++) {
                    const token = tokens[i];
                    const proxy = proxies[i % proxies.length] || null;
                    console.log(`🚀 Connecting WebSocket for account ${i + 1} - Proxy: ${proxy || 'None'}`);

                    const wsClient = new WebSocketClient(token, proxy);
                    wsClient.connect();
                    wsClients.push(wsClient);
                    await new Promise(resolve => setTimeout(resolve, 1000));
                }

                process.on('SIGINT', () => {
                    console.log('🛑 Stopping all WebSockets...');
                    wsClients.forEach(client => client.disconnect());
                    process.exit(0);
                });
            } else {
                console.log('❌ No tokens found in tokens.txt - exiting...');
                process.exit(0);
            }
        });
    } catch (error) {
        console.error('❌ Error in main function:', error);
    }
}

main();

const WebSocket = require('ws');
const fs = require('fs/promises');
const HttpsProxyAgent = require('https-proxy-agent');

async function readFile(filePath) {
    try {
        const data = await fs.readFile(filePath, 'utf-8');
        return data.split('\n').map(line => line.trim()).filter(line => line);
    } catch (error) {
        console.error('Error reading file:', error.message);
        return [];
    }
}

async function getEmailFromToken(token) {
    try {
        const response = await fetch("https://api.teneo.pro/userinfo", {
            headers: { Authorization: `Bearer ${token}` }
        });
        const data = await response.json();
        return data.email || "Unknown";
    } catch (error) {
        console.error("❌ Failed to fetch email:", error.message);
        return "Unknown";
    }
}

class WebSocketClient {
    constructor(token, proxy = null) {
        this.token = token;
        this.proxy = proxy;
        this.socket = null;
        this.email = "Unknown";
    }

    async connect() {
        this.email = await getEmailFromToken(this.token); // Token မှာ Email ရှာမယ်
        const wsUrl = `wss://secure.ws.teneo.pro/websocket?accessToken=${encodeURIComponent(this.token)}`;

        const options = this.proxy ? { agent: new HttpsProxyAgent(this.proxy) } : {};
        this.socket = new WebSocket(wsUrl, options);

        this.socket.onopen = () => {
            console.log(`✅ Connected as ${this.email} | Token: ${this.token}`);
            this.socket.send(JSON.stringify({ type: "IDENTIFY", token: this.token })); 
        };

        this.socket.onmessage = (event) => {
            const data = JSON.parse(event.data);
            if (data.type === "IDENTIFIED" && data.user && data.user.email) {
                this.email = data.user.email;
                console.log(`✅ Identified: ${this.email}`);
            } else {
                console.log(`📩 Response for ${this.email}:`, data);
            }
        };

        this.socket.onclose = () => {
            console.log(`❌ Disconnected: ${this.email}`);
        };

        this.socket.onerror = (error) => {
            console.error(`⚠️ WebSocket error for ${this.email}:`, error.message);
        };
    }
}

async function main() {
    const tokens = await readFile('tokens.txt');
    const proxies = await readFile('proxies.txt');

    if (tokens.length > 0) {
        for (let i = 0; i < tokens.length; i++) {
            const token = tokens[i];
            const proxy = proxies[i % proxies.length] || null;
            const wsClient = new WebSocketClient(token, proxy);
            wsClient.connect();
            await new Promise(resolve => setTimeout(resolve, 1000));
        }
    } else {
        console.log('⚠️ No tokens found in tokens.txt - exiting...');
    }
}

main();

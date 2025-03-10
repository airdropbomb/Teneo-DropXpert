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
            this.socket.send(JSON.stringify({ type: "IDENTIFY", token: this.token })); // Account Info ရယူမယ်
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

    startPinging() {
        this.stopPinging();
        this.pingInterval = setInterval(() => {
            if (this.socket && this.socket.readyState === WebSocket.OPEN) {
                this.socket.send(JSON.stringify({ type: "PING" }));
                console.log(`📡 Ping sent for ${this.email} | Token: ${maskToken(this.token)} at ${new Date().toISOString()}`);
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

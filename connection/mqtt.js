const mqtt = require("mqtt");
const winston = require("winston");
const { generateCuid } = require("../services/cuidgenerator");

const logger = winston.createLogger({
    level: "info",
    format: winston.format.simple(),
    transports: [
        new winston.transports.File({ filename: "logs.log" }),
    ],
});

// Konfigurasi disesuaikan dengan .env VPS Anda
const MQTTSettings = {
    host: process.env.MQTT_HOST,
    port: process.env.MQTT_PORT,
    username: process.env.MQTT_USERNAME,
    password: process.env.MQTT_PASSWORD,
    clientId: `smartdoor_backend_${Math.random().toString(16).substr(2, 8)}`, // Client ID unik wajib di MQTT
    baseTopic: "smartdoor" // Prefix topik agar rapi
};

class MQTTConnection {
    constructor() {
        this.client = null;
        this.isConnected = false;
        this.routes = []; // Menyimpan list topik & callback
    }

    static getInstance() {
        if (!MQTTConnection.instance) MQTTConnection.instance = new MQTTConnection();
        return MQTTConnection.instance;
    }

    static async createConnection() {
        const instance = this.getInstance();
        if (instance.client) return;

        const url = `mqtt://${MQTTSettings.host}:${MQTTSettings.port}`;
        instance.client = mqtt.connect(url, {
            username: MQTTSettings.username,
            password: MQTTSettings.password,
            clientId: MQTTSettings.clientId,
            clean: true,
            reconnectPeriod: 2000,
        });

        instance.client.on("connect", () => {
            console.log("✅ MQTT Connected to Broker");
            instance.isConnected = true;
            // Subscribe ulang otomatis jika reconnect
            instance.routes.forEach(r => instance.client.subscribe(r.topicPattern, { qos: 1 }));
        });

        // Single Listener untuk merouting semua pesan
        instance.client.on("message", (receivedTopic, messageBuffer) => {
            instance.routes.forEach(route => {
                if (this.matchTopic(route.topicPattern, receivedTopic)) {
                    route.callback(receivedTopic, messageBuffer);
                }
            });
        });
    }

    static matchTopic(pattern, topic) {
        if (pattern === topic) return true;
        const pParts = pattern.split('/');
        const tParts = topic.split('/');
        for (let i = 0; i < pParts.length; i++) {
            if (pParts[i] === '#') return true;
            if (pParts[i] !== '+' && pParts[i] !== tParts[i]) return false;
        }
        return pParts.length === tParts.length;
    }

    static async subscribe(topicPattern, callback) {
        const instance = this.getInstance();
        instance.routes.push({ topicPattern, callback });
        if (instance.isConnected) {
            instance.client.subscribe(topicPattern, { qos: 1 });
            console.log(`📥 Subscribed to ${topicPattern}`);
        }
    }

    static async publish(topic, payload) {
        const instance = this.getInstance();
        if (!instance.isConnected) return false;
        
        const finalPayload = typeof payload === 'object' ? JSON.stringify(payload) : payload;
        instance.client.publish(topic, finalPayload, { qos: 1 }, (err) => {
            if (err) console.error("❌ Publish error:", err);
            else console.log(`📤 Sent to ${topic}`);
        });
    }
}

module.exports = { MQTTConnection };
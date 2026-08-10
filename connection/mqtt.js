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
    }

    static getInstance() {
        if (!MQTTConnection.instance) {
            MQTTConnection.instance = new MQTTConnection();
        }
        return MQTTConnection.instance;
    }

    // 1. Create connection to MQTT Broker
    static async createConnection() {
        try {
            const instance = this.getInstance();
            const url = `mqtt://${MQTTSettings.host}:${MQTTSettings.port}`;

            instance.client = mqtt.connect(url, {
                username: MQTTSettings.username,
                password: MQTTSettings.password,
                clientId: MQTTSettings.clientId,
                clean: true,
                connectTimeout: 4000,
                reconnectPeriod: 2000, // Fitur unggul MQTT: Auto reconnect jika putus
            });

            instance.client.on("connect", () => {
                console.log(" [i]: ✅ Connection to MQTT Broker established");
                instance.isConnected = true;
            });

            instance.client.on("error", (err) => {
                console.error(" [e]: ❌ MQTT Connection error:", err.message);
                instance.isConnected = false;
            });

            instance.client.on("close", () => {
                console.log(" [i]: ⚠️ MQTT Connection closed");
                instance.isConnected = false;
            });

        } catch (error) {
            console.error(" [e]: Failed to connect to MQTT:", error);
        }
    }

    // 2. Send message (Pengganti channel.publish)
    static async sendMessage(message, topic, isRaw = false) {
        try {
            const instance = this.getInstance();
                if (!instance.isConnected) {
                console.warn(" [w]: MQTT not connected, cannot send message");
                return false;
            }
        
            const payload = {
                ...JSON.parse(message),
                messageId: generateCuid(),
                broadcastTimeAt: new Date(),
            };
        
            // FIX: Jika isRaw true, gunakan topik apa adanya (untuk hardware)
            const finalTopic = isRaw ? topic : (topic.startsWith(MQTTSettings.baseTopic) 
                ? topic 
                : `${MQTTSettings.baseTopic}/${topic}`);
                
            instance.client.publish(finalTopic, JSON.stringify(payload), { qos: 1 }, (err) => {
                if (err) console.error(" [e]: Failed to publish message:", err);
                else console.log(` [x]: 📤 Sent to "${finalTopic}"`);
            });
            return true;
        } catch (error) {
            console.error(" [e]: Error in sendMessage:", error);
            return false;
        }
    }

    // 3. Consume message
    static async consumeMessage({ topic, callbackFn, isRaw = false }) {
        try {
            const instance = this.getInstance();
            if (!instance.isConnected) return;

            // FIX: Jika isRaw true, gunakan topik apa adanya
            const finalTopic = isRaw ? topic : (topic.startsWith(MQTTSettings.baseTopic) 
                ? topic 
                : `${MQTTSettings.baseTopic}/${topic}`);
                
            console.log(` [i]: 📥 Subscribing to "${finalTopic}"`);
            instance.client.subscribe(finalTopic, { qos: 1 });
            
            instance.client.on("message", (receivedTopic, messageBuffer) => {
                if (receivedTopic === finalTopic || receivedTopic.startsWith(finalTopic.replace('/#', '').replace('/+', ''))) {
                    if (callbackFn) callbackFn(messageBuffer); // Pass Buffer langsung agar bisa handle binary gambar
                }
            });
        } catch (error) {
            console.error(" [e]: Error in consumeMessage:", error);
        }
    }
}

module.exports = { MQTTConnection };
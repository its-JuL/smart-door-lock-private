const mqtt = require("mqtt");
const { PrismaClient } = require("@prisma/client");
const prisma = new PrismaClient();
const { MQTTRegistrationBridge } = require("./mqttRegistrationBridge");

const MQTTSettings = {
    host: process.env.MQTT_HOST,
    port: process.env.MQTT_PORT,
    username: process.env.MQTT_USERNAME,
    password: process.env.MQTT_PASSWORD,
    clientId: `smartdoor_logger_${Math.random().toString(16).substr(2, 8)}`,
};

class MQTTLogger {
    static async start() {
        const client = mqtt.connect(`mqtt://${MQTTSettings.host}:${MQTTSettings.port}`, {
            username: MQTTSettings.username,
            password: MQTTSettings.password,
            clientId: MQTTSettings.clientId,
        });

        client.on("connect", () => {
          console.log(" [i]: ✅ MQTT Logger connected. Listening for events...");

          client.subscribe(process.env.TOPIC_AUTH, { qos: 1 });
          client.subscribe(process.env.TOPIC_STATUS, { qos: 1 });
          client.subscribe(process.env.TOPIC_REGISTRATION, { qos: 1 });
          client.subscribe("doorlock/+/user/search/request", { qos: 1 });
          client.subscribe("doorlock/+/user/register/request", { qos: 1 });
          client.subscribe("doorlock/+/registration/auth/request", { qos: 1 });

          // Jangan subscribe TOPIC_CAM_FRAME_BIN
          // karena isinya binary JPEG.
        });

        client.on("message", async (topic, message) => {
            try {
                // Abaikan binary frame agar tidak crash di JSON.parse
                if (topic.endsWith("/camera/frame")) return;

                const payload = JSON.parse(message.toString());
                const topicParts = topic.split("/");
                const deviceId = topicParts[1] || payload.device_id; 
                
                console.log(` [d]: 📩 Event on ${topic}:`, payload);

                if (await MQTTRegistrationBridge.handle(client, topic, deviceId, payload)) return;

                if (topic.includes("/auth")) {
                    await this.handleAuth(deviceId, payload);
                }
                else if (topic.includes("/registration")) {
                    await this.handleRegistration(client, deviceId, payload);
                }
                else if (topic.includes("/status")) {
                    await this.handleStatus(deviceId, payload);
                }

            } catch (error) {
                console.error(" [e]: Error processing MQTT message:", error);
            }
        });

        client.on("error", (err) => {
            console.error(" [e]: MQTT Logger connection error:", err.message);
        });
    }

    // ======================= 1. AUTH EVENT =======================
    static async handleAuth(deviceId, payload) {
        const { method, result, card_number, finger_id, pin_hash, user_id } = payload;
        console.log(` [i]: Auth Event: ${deviceId} - ${method} - ${result}`);
        
        const device = await prisma.device.findUnique({
            where: { device_id: deviceId },
            select: { roomId: true }
        });

        let cardId = null;
        let roomId = device?.roomId || null;
        let unregisteredCard = null;
        let isSuccess = result === "granted";

        try {
            // A. RFID
            if (method === "RFID" && card_number) {
                const card = await prisma.card.findUnique({ 
                    where: { card_number },
                    include: { room: true }
                });
                if (card) {
                    cardId = card.id;
                    // Override hasil lokal jika di DB ternyata kartu di-banned / UNREGISTER
                    if (card.banned || card.card_status === "UNREGISTER") isSuccess = false;
                    if (card.room && card.room.length > 0) roomId = card.room[0].id;
                } else {
                    unregisteredCard = card_number;
                    isSuccess = false;
                }
            } 
            // B. Fingerprint
            else if (method === "fingerprint" && finger_id) {
                const fp = await prisma.fingerprintMapping.findUnique({
                    where: { 
                        deviceId_fingerId: { 
                            deviceId: deviceId, 
                            fingerId: parseInt(finger_id) 
                        } 
                    },
                    include: { room: true }
                });
                if (fp && fp.isActive) {
                    roomId = fp.roomId;
                } else {
                    isSuccess = false;
                }
            } 
            // C. PIN
            else if (method === "PIN" && pin_hash) {
                const pin = await prisma.pinCredential.findFirst({
                    where: { devicePinHash: String(pin_hash).toLowerCase(), isActive: true },
                    include: { room: true }
                });
                if (pin) {
                    roomId = pin.roomId;
                } else {
                    isSuccess = false;
                }
            }
            // D. Face Recognition
            else if (method === "camera" && user_id) {
                const user = await prisma.user.findUnique({ where: { id: user_id } });
                if (!user) isSuccess = false;
            }
            // E. Exit Button / Fallback
            else if (method !== "exit button") {
                unregisteredCard = payload.detail || "Unknown Method";
            }

            await prisma.rooms_Records.create({
                data: {
                    roomId: roomId,
                    cardId: cardId,
                    unregisteredCard: unregisteredCard,
                    isSuccess: isSuccess,
                },
            });
            console.log(` [i]: ✅ Access log saved. Success: ${isSuccess}`);
        } catch (dbError) {
            console.error(" [e]: DB Error on handleAuth:", dbError);
        }
    }

    // ======================= 2. REGISTRATION EVENT =======================
    static publishRegistrationResult(client, deviceId, payload) {
        const topic = `doorlock/${deviceId}/registration/result`;
        client.publish(topic, JSON.stringify(payload), { qos: 1 });
    }

    static async handleRegistration(client, deviceId, payload) {
        const { method, result, card_number, finger_id, user_id, session_id } = payload;
        const normalizedResult = String(result || "").toLowerCase();
        const aliases = { card: "rfid", rfid: "rfid", fingerprint: "fingerprint" };
        const normalizedMethod = aliases[String(method || "").toLowerCase()];
        const response = { session_id, user_id, method: normalizedMethod || method, success: false };

        try {
            if (normalizedResult !== "granted" && normalizedResult !== "success") throw new Error(payload.detail || "Hardware enrollment failed");
            if (!normalizedMethod) throw new Error("Unsupported registration method");
            if (!session_id || !user_id) throw new Error("Missing session_id or user_id; firmware must be flashed with V5 website-enrollment support");

            const device = await prisma.device.findUnique({ where: { device_id: deviceId }, select: { roomId: true } });
            if (!device?.roomId) throw new Error("Device not found or not assigned to a room");
            if (!await prisma.user.findUnique({ where: { id: user_id }, select: { id: true } })) throw new Error("Selected user does not exist");

            const pending = MQTTRegistrationBridge.getEnrollment(deviceId, session_id, normalizedMethod, user_id);
            // Fallback enrollment context: V5 returns signed-in user/session in its event.
            // Do not reject a valid event merely because nodemon restarted and lost its in-memory map.
            if (pending && pending.roomId !== device.roomId) throw new Error("Enrollment room does not match device room");

            if (normalizedMethod === "fingerprint") {
                const fingerId = Number.parseInt(finger_id, 10);
                if (!Number.isInteger(fingerId) || fingerId < 2) throw new Error("Valid user finger_id is required");
                await prisma.fingerprintMapping.upsert({
                    where: { deviceId_fingerId: { deviceId, fingerId } },
                    update: { userId: user_id, roomId: device.roomId, isActive: true },
                    create: { deviceId, fingerId, userId: user_id, roomId: device.roomId, isActive: true }
                });
                MQTTRegistrationBridge.consumeEnrollment(deviceId, session_id, normalizedMethod, user_id);
                response.finger_id = fingerId;
            } else {
                const cardNumber = String(card_number || "").replaceAll(" ", "").toUpperCase();
                if (!cardNumber) throw new Error("card_number is required");
                await prisma.card.upsert({
                    where: { card_number: cardNumber },
                    update: { userId: user_id, card_status: "REGISTER", banned: false, room: { connect: { id: device.roomId } } },
                    create: { card_number: cardNumber, userId: user_id, card_status: "REGISTER", card_name: `RFID ${cardNumber}`, room: { connect: { id: device.roomId } } }
                });
                MQTTRegistrationBridge.consumeEnrollment(deviceId, session_id, normalizedMethod, user_id);
                response.card_number = cardNumber;
            }
            response.success = true;
            response.detail = `${normalizedMethod} mapping stored in database`;
        } catch (error) {
            response.detail = error.message;
            console.error(" [e]: DB Error on handleRegistration:", error.message);
        }
        this.publishRegistrationResult(client, deviceId, response);
    }

    // Camera frames are processed only by the Python face-recognition service.
    // Do not publish an authorization result from camera metadata: it contains no image.

    // ======================= 4. STATUS EVENT =======================
    static async handleStatus(deviceId, payload) {
        console.log(` [i]: Status Event: ${deviceId} - ${payload.status}`);
        if (payload.status === "online" || payload.uptime_ms) {
            try {
                await prisma.device.update({
                    where: { device_id: deviceId },
                    data: { lastOnline: new Date() }
                });
            } catch (err) {
                // Ignore jika device belum didaftarkan di tabel Device
            }
        }
    }
}

module.exports = { MQTTLogger };
const mqtt = require("mqtt");
const { PrismaClient } = require("@prisma/client");
const prisma = new PrismaClient();

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
          client.subscribe(process.env.TOPIC_CAM_FRAME_META, { qos: 1 });

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

                if (topic.includes("/auth")) {
                    await this.handleAuth(deviceId, payload);
                }
                else if (topic.includes("/registration")) {
                    await this.handleRegistration(deviceId, payload);
                }
                else if (topic.includes("/camera/frame/meta")) {
                    await this.handleCameraMeta(deviceId, payload, client);
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
                    where: { pinHash: pin_hash, isActive: true },
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
    static async handleRegistration(deviceId, payload) {
        const { method, result, card_number, finger_id, pin_hash } = payload;
        console.log(` [i]: Registration Event: ${deviceId} - ${method} - ${result}`);

        // Hanya sinkronisasi ke DB jika hardware sukses menyimpan ke EEPROM
        if (result !== "granted") return; 

        try {
            if (method === "rfid" && card_number) {
                await prisma.card.upsert({
                    where: { card_number },
                    update: { card_status: "REGISTER" },
                    create: { 
                        card_number, 
                        card_status: "REGISTER", 
                        card_name: "Kartu Baru (Sync dari Hardware)" 
                    }
                });
                console.log(` [i]: ✅ Card ${card_number} otomatis tersinkronisasi ke DB`);
            }
            else if (method === "fingerprint" && finger_id) {
                console.log(` [i]: ⚠️ Fingerprint ID ${finger_id} enrolled. Perlu mapping User/Room via Admin UI.`);
            }
            else if (method === "pin" && pin_hash) {
                console.log(` [i]: ⚠️ PIN enrolled. Perlu mapping User/Room via Admin UI.`);
            }
            else if (method === "face") {
                console.log(` [i]: ⚠️ Face enrolled. Perlu mapping User/Room via Admin UI.`);
            }
        } catch (dbError) {
            console.error(" [e]: DB Error on handleRegistration:", dbError);
        }
    }

    // ======================= 3. CAMERA META EVENT =======================
    static async handleCameraMeta(deviceId, payload, client) {
        console.log(` [i]: Camera Meta: Type=${payload.type}, Seq=${payload.sequence}`);
        
        // --- TEMPAT INTEGRASI FACE RECOGNITION (ML/AI) ---
        // Secara real, backend harus menunggu binary frame dari /camera/frame, 
        // memprosesnya dengan ML (FaceAPI/InsightFace), lalu mencari match di DB.
        
        // MOCK RESULT (Sementara agar pintu bisa terbuka saat testing)
        const mockMatch = true; 
        const mockUserId = "cuid_user_123"; // Ganti dengan query DB real nanti
        
        const resultPayload = {
            type: payload.type, // "recognize" atau "enroll"
            match: payload.type === "recognize" ? mockMatch : undefined,
            saved: payload.type === "enroll" ? true : undefined,
            reason: payload.type === "recognize" ? (mockMatch ? mockUserId : "no_match") : "Face enrolled",
            session_id: payload.session_id // Pass back session_id jika ada
        };

        // Balas ke Main ESP32 (Topik result selalu ke device_id utama)
        const resultTopic = process.env.TOPIC_CAM_RESULT.replace(
          "{device_id}",
          "main_esp32_01"
        );
        client.publish(
          resultTopic,
          JSON.stringify(resultPayload),
          { qos: 1 },
          (err) => {
              if (err) {
                  console.error(" [e]: Failed to publish camera result:", err);
              } else {
                  console.log(` [i]: 📤 Camera result sent to ${resultTopic}`);
              }
          }
        );
    }

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
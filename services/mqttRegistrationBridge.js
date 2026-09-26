const { PrismaClient } = require("@prisma/client");
const { hasher } = require("./auth");
const { buildUserSearchResult, buildAuthRegistrationPlan } = require("./hardwareRegistration");
const prisma = new PrismaClient();
const pendingFaceEnrollments = new Map();
const pendingEnrollments = new Map();
// Two fingerprint scans plus removal can exceed one minute; keep the server-side correlation alive.
const ENROLLMENT_TTL_MS = 180000;

class MQTTRegistrationBridge {
  static publish(client, topic, payload) { client.publish(topic, JSON.stringify(payload), { qos: 1 }); }
  static resultTopic(deviceId, suffix) { return `doorlock/${deviceId}/${suffix}/result`; }
  static enrollmentKey(deviceId, sessionId) { return `${deviceId}:${sessionId}`; }
  static trackEnrollment({ deviceId, sessionId, userId, roomId, method }) {
    const item = { deviceId, sessionId, userId, roomId, method: String(method).toLowerCase(), expiresAt: Date.now() + ENROLLMENT_TTL_MS };
    pendingEnrollments.set(this.enrollmentKey(deviceId, sessionId), item);
    setTimeout(() => { const key = this.enrollmentKey(deviceId, sessionId); const current = pendingEnrollments.get(key); if (current && current.expiresAt <= Date.now()) pendingEnrollments.delete(key); }, ENROLLMENT_TTL_MS + 1000).unref();
  }
  static getEnrollment(deviceId, sessionId, method, userId) {
    const item = pendingEnrollments.get(this.enrollmentKey(deviceId, sessionId));
    if (!item || item.expiresAt <= Date.now()) { if (item) pendingEnrollments.delete(this.enrollmentKey(deviceId, sessionId)); return null; }
    return item.deviceId === deviceId && item.method === String(method).toLowerCase() && item.userId === userId ? { deviceId: item.deviceId, sessionId: item.sessionId, userId: item.userId, roomId: item.roomId, method: item.method } : null;
  }
  static consumeEnrollment(deviceId, sessionId, method, userId) {
    const item = this.getEnrollment(deviceId, sessionId, method, userId);
    if (item) pendingEnrollments.delete(this.enrollmentKey(deviceId, sessionId));
    return item;
  }
  static trackFaceEnrollment({ deviceId, sessionId, userId, roomId }) {
    pendingFaceEnrollments.set(sessionId, { deviceId, userId, roomId, expiresAt: Date.now() + 60000 });
    setTimeout(() => { const item = pendingFaceEnrollments.get(sessionId); if (item && item.expiresAt <= Date.now()) pendingFaceEnrollments.delete(sessionId); }, 61000).unref();
  }
  static consumeFaceEnrollment(deviceId, sessionId) {
    const item = pendingFaceEnrollments.get(sessionId);
    if (!item || item.deviceId !== deviceId || item.expiresAt <= Date.now()) { if (item) pendingFaceEnrollments.delete(sessionId); return null; }
    pendingFaceEnrollments.delete(sessionId); return item;
  }
  static async handle(client, topic, deviceId, payload) {
    if (topic.endsWith("/user/search/request")) return this.search(client, deviceId, payload);
    if (topic.endsWith("/user/register/request")) return this.registerUser(client, deviceId, payload);
    if (topic.endsWith("/registration/auth/request")) return this.registerAuth(client, deviceId, payload);
    return false;
  }
  static async search(client, deviceId, payload) {
    const query = String(payload.query || "").trim(); const limit = Math.min(Math.max(parseInt(payload.limit, 10) || 4, 1), 5);
    if (!query) return this.publish(client, this.resultTopic(deviceId, "user/search"), { success:false, detail:"Search query is required", session_id:payload.session_id });
    const users = await prisma.user.findMany({ where:{ OR:[{username:{contains:query,mode:"insensitive"}},{profil:{full_name:{contains:query,mode:"insensitive"}}}] }, select:{id:true,username:true}, orderBy:{username:"asc"}, take:limit });
    this.publish(client, this.resultTopic(deviceId, "user/search"), buildUserSearchResult({sessionId:payload.session_id, users}));
    return true;
  }
  static async registerUser(client, deviceId, payload) {
    const topic=this.resultTopic(deviceId,"user/register"), username=String(payload.username||"").trim(), hash=String(payload.password_hash||"").toLowerCase();
    if (!/^[A-Za-z0-9_.-]{3,32}$/.test(username) || !/^[a-f0-9]{64}$/.test(hash)) return this.publish(client,topic,{success:false,detail:"Invalid username or password hash",session_id:payload.session_id});
    if (await prisma.user.findUnique({where:{username}})) return this.publish(client,topic,{success:false,detail:"Username already exists",session_id:payload.session_id});
    const role=await prisma.role.findUnique({where:{name:"USER"}}); if (!role) throw new Error("USER role is missing");
    const email=`${username.toLowerCase()}@device.local`; if (await prisma.user.findUnique({where:{email}})) return this.publish(client,topic,{success:false,detail:"Device email already exists",session_id:payload.session_id});
    const user=await prisma.user.create({data:{username,email,password:hasher(`device:${hash}:${Date.now()}`),roleId:role.id,profil:{create:{full_name:username}}},select:{id:true,username:true}});
    this.publish(client,topic,{success:true,detail:"User registered",session_id:payload.session_id,user_id:user.id,username:user.username}); return true;
  }
  static async registerAuth(client, deviceId, payload) {
    const topic=this.resultTopic(deviceId,"registration/auth");
    try {
      const device=await prisma.device.findUnique({where:{device_id:deviceId},select:{device_id:true,roomId:true}}); const plan=buildAuthRegistrationPlan({device,payload});
      if (!await prisma.user.findUnique({where:{id:plan.userId},select:{id:true}})) throw new Error("Selected user does not exist");
      if(plan.kind==="fingerprint") await prisma.fingerprintMapping.upsert({where:{deviceId_fingerId:{deviceId:plan.deviceId,fingerId:plan.fingerId}},update:{userId:plan.userId,roomId:plan.roomId,isActive:true},create:{deviceId:plan.deviceId,fingerId:plan.fingerId,userId:plan.userId,roomId:plan.roomId,isActive:true}});
      else if(plan.kind==="rfid") await prisma.card.upsert({where:{card_number:plan.cardNumber},update:{userId:plan.userId,card_status:"REGISTER",banned:false,room:{connect:{id:plan.roomId}}},create:{card_number:plan.cardNumber,userId:plan.userId,card_status:"REGISTER",card_name:`RFID ${plan.cardNumber}`,room:{connect:{id:plan.roomId}}}});
      else { const existing=await prisma.pinCredential.findUnique({where:{userId:plan.userId}}); const data={roomId:plan.roomId,devicePinHash:plan.devicePinHash,isActive:true}; if(existing) await prisma.pinCredential.update({where:{id:existing.id},data}); else await prisma.pinCredential.create({data:{...data,userId:plan.userId,pinHash:hasher(`hardware:${plan.devicePinHash}:${Date.now()}`)}}); }
      this.publish(client,topic,{success:true,detail:`${plan.kind} mapped`,session_id:plan.sessionId}); return true;
    } catch(error) { this.publish(client,topic,{success:false,detail:error.message,session_id:payload.session_id}); return true; }
  }
  static async setupSubscriptions() {
    const { MQTTConnection } = require("../connection/mqtt");
    
    const topics = [
      "doorlock/+/registration/auth/request",
      "doorlock/+/user/search/request",
      "doorlock/+/user/register/request"
    ];

    for (const topic of topics) {
      await MQTTConnection.subscribe(topic, async (receivedTopic, messageBuffer) => {
        try {
          const parts = receivedTopic.split("/");
          const deviceId = parts[1];
          const payload = JSON.parse(messageBuffer.toString());
          const client = MQTTConnection.getInstance().client;
          
          console.log(`[MQTT Bridge] Received on ${receivedTopic}`);
          await this.handle(client, receivedTopic, deviceId, payload);
        } catch (error) {
          console.error(`[MQTT Bridge] Error handling ${receivedTopic}:`, error);
        }
      });
    }
    
    console.log("✅ MQTTRegistrationBridge subscriptions ready");
  }
}
module.exports={MQTTRegistrationBridge};

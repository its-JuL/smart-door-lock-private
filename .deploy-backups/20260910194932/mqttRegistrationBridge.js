const { PrismaClient } = require("@prisma/client");
const { hasher } = require("./auth");
const { buildUserSearchResult, buildAuthRegistrationPlan } = require("./hardwareRegistration");
const prisma = new PrismaClient();

class MQTTRegistrationBridge {
  static publish(client, topic, payload) { client.publish(topic, JSON.stringify(payload), { qos: 1 }); }
  static resultTopic(deviceId, suffix) { return `doorlock/${deviceId}/${suffix}/result`; }
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
}
module.exports={MQTTRegistrationBridge};

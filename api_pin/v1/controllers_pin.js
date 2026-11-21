const prisma = require("../../prisma/client");
const { resSuccess, resError } = require("../../services/responseHandler");
const { MQTTConnection } = require("../../connection/mqtt");
const { hasher } = require("../../services/auth");
const { buildPinEnrollmentPlan } = require("../../services/pinEnrollment");
const { deviceWhereForScope } = require("../../services/operatorScope");
const crypto = require("crypto");

class EnrollmentInputError extends Error {
  constructor(message, code = 400) {
    super(message);
    this.code = code;
    this.expose = true;
  }
}

async function findDeviceAndUser(deviceId, targetUserId) {
  const [device, user] = await Promise.all([
    prisma.device.findUnique({ where: { device_id: deviceId }, select: { device_id: true, roomId: true } }),
    prisma.user.findUnique({ where: { id: targetUserId }, select: { id: true, username: true, profil: { select: { full_name: true } } } }),
  ]);
  if (!device) throw new EnrollmentInputError(`Device "${deviceId}" belum terdaftar di website. Tambahkan dulu lewat menu Hardware.`, 404);
  if (!user) throw new EnrollmentInputError("Pengguna target tidak ditemukan.", 404);
  if (!device.roomId) throw new EnrollmentInputError(`Device "${deviceId}" belum dipasangkan ke room mana pun.`, 400);
  return { device, user };
}
exports.registerPin = async (req, res) => {
  const { pin, deviceId, targetUserId } = req.body;
  try {
    const { device, user } = await findDeviceAndUser(deviceId, targetUserId);
    const sessionId = `pin_${Date.now()}_${crypto.randomBytes(4).toString("hex")}`;
    const plan = buildPinEnrollmentPlan({ device, targetUserId: user.id, pin, sessionId });
    await MQTTConnection.publish(`doorlock/${plan.deviceId}/command`, plan.command);
    const credential = await prisma.pinCredential.upsert({
      where: { deviceId_devicePinHash: { deviceId: plan.deviceId, devicePinHash: plan.devicePinHash } },
      update: { userId: user.id, pinHash: hasher(pin), isActive: true },
      create: { userId: user.id, deviceId: plan.deviceId, pinHash: hasher(pin), devicePinHash: plan.devicePinHash, isActive: true },
    });
    return resSuccess({ res, title: "PIN saved and sent to hardware", data: { id: credential.id, userId: user.id, username: user.username, fullName: user.profil?.full_name || null, deviceId: plan.deviceId, isActive: credential.isActive, createdAt: credential.createdAt, sessionId } });
  } catch (error) {
    if (error.expose) return resError({ res, title: error.message, code: error.code });
    return resError({ res, title: "Failed to register PIN", errors: error.message });
  }
};
exports.listPins = async (req, res) => {
  try {
    const where = deviceWhereForScope(req.accessScope, req.query.deviceId);
    const pins = await prisma.pinCredential.findMany({
      where,
      include: {
        user: {
          select: {
            username: true,
            profil: { select: { full_name: true } },
          },
        },
      },
      orderBy: { createdAt: "desc" },
    });
    const devices = await prisma.device.findMany({
      where: {
        device_id: { in: [...new Set(pins.map((p) => p.deviceId))] },
      },
      select: {
        device_id: true,
        room: { select: { ruid: true, name: true } },
      },
    });
    const map = new Map(devices.map(d => [d.device_id, d]));
    return resSuccess({ res, title: "PIN credentials retrieved", data: pins.map(p => ({ id:p.id, userId:p.userId, username:p.user.username, fullName:p.user.profil?.full_name || null, deviceId:p.deviceId, roomName:map.get(p.deviceId)?.room?.name || "-", roomRuid:map.get(p.deviceId)?.room?.ruid || null, isActive:p.isActive, createdAt:p.createdAt })) });
  } catch (error) { return resError({ res, title:"Failed to retrieve PINs", errors:error.message }); }
};
exports.updatePin = async (req,res) => {
  try {
    const existing=await prisma.pinCredential.findUnique({where:{id:req.params.pinId}}); if(!existing) return resError({res,title:"PIN not found",statusCode:404});
    const {device}=await findDeviceAndUser(existing.deviceId,existing.userId); const plan=buildPinEnrollmentPlan({device,targetUserId:existing.userId,pin:req.body.newPin});
    await MQTTConnection.publish(`doorlock/${existing.deviceId}/command`,{action:"delete_user_pin",user_id:existing.userId,pin_hash:existing.devicePinHash});
    await MQTTConnection.publish(`doorlock/${existing.deviceId}/command`,plan.command);
    const updated=await prisma.pinCredential.update({where:{id:existing.id},data:{pinHash:hasher(req.body.newPin),devicePinHash:plan.devicePinHash,isActive:true}});
    return resSuccess({res,title:"PIN updated and sent to hardware",data:{id:updated.id,deviceId:updated.deviceId,userId:updated.userId,updatedAt:updated.updatedAt}});
  } catch(error) { return resError({res,title:"Failed to update PIN",errors:error.message}); }
};
exports.deletePin = async (req,res) => {
  try { const existing=await prisma.pinCredential.findUnique({where:{id:req.params.pinId}}); if(!existing)return resError({res,title:"PIN not found",statusCode:404}); await MQTTConnection.publish(`doorlock/${existing.deviceId}/command`,{action:"delete_user_pin",user_id:existing.userId,pin_hash:existing.devicePinHash}); await prisma.pinCredential.delete({where:{id:existing.id}}); return resSuccess({res,title:"PIN deletion sent to hardware and removed from database"}); } catch(error) { return resError({res,title:"Failed to delete PIN",errors:error.message}); }
};

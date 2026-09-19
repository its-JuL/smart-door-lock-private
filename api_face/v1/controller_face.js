const prisma = require("../../prisma/client");
const { getUser } = require("../../services/auth");
const { resSuccess, resError } = require("../../services/responseHandler");
const { MQTTConnection } = require("../../connection/mqtt");
const { MQTTRegistrationBridge } = require("../../services/mqttRegistrationBridge");
exports.initiateFaceEnrollment = async (req, res) => {
  const { deviceId, targetUserId } = req.body;
  if (!deviceId || !targetUserId) return resError({ res, title: "deviceId and targetUserId are required", statusCode: 400 });
  try {
    const [device, user] = await Promise.all([prisma.device.findUnique({ where: { device_id: deviceId }, select: { device_id: true, roomId: true } }), prisma.user.findUnique({ where: { id: targetUserId }, select: { id: true, username: true } })]);
    if (!device) return resError({ res, title: "Device not found", statusCode: 404 });
    if (!device.roomId) return resError({ res, title: "Device is not assigned to a room", statusCode: 400 });
    if (!user) return resError({ res, title: "Target user not found", statusCode: 404 });
    const { createEnrollmentSessionId, buildEnrollmentCommand } = require("../../services/webEnrollment");
    const sessionId = createEnrollmentSessionId("face");
    const command = buildEnrollmentCommand({ method: "face", deviceId, userId: user.id, username: user.username, sessionId });
    MQTTRegistrationBridge.trackFaceEnrollment({ deviceId, sessionId, userId: user.id, roomId: device.roomId });
    try {
      // Python receives identity context before the device triggers its camera.
      await MQTTConnection.publish(`doorlock/${deviceId}/face/enroll/context`, { ...command.payload, requested_by: getUser(req) });
      await MQTTConnection.publish(command.topic, command.payload);
    } catch (publishError) {
      MQTTRegistrationBridge.consumeFaceEnrollment(deviceId, sessionId);
      throw publishError;
    }
    return resSuccess({ res, title: "Face enrollment initiated", data: { sessionId, status: "waiting_for_device" } });
  } catch (error) { return resError({ res, title: "Failed to initiate face enrollment", errors: error.message }); }
};

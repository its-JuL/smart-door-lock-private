const prisma = require("../../prisma/client");
const { getUser } = require("../../services/auth");
const { resSuccess, resError } = require("../../services/responseHandler");
const { MQTTConnection } = require("../../connection/mqtt");
const { MQTTRegistrationBridge } = require("../../services/mqttRegistrationBridge");
const fs = require("fs");
const path = require("path");

const CAPTURE_DIR = path.join(__dirname, "../../capture");

exports.initiateFaceEnrollment = async (req, res) => {
  const { deviceId, targetUserId } = req.body;
  if (!deviceId || !targetUserId) return resError({ res, title: "deviceId and targetUserId are required", statusCode: 400 });
  
  try {
    const [device, user] = await Promise.all([
      prisma.device.findUnique({ where: { device_id: deviceId }, select: { device_id: true, roomId: true } }),
      prisma.user.findUnique({ where: { id: targetUserId }, select: { id: true, username: true } })
    ]);
    
    if (!device) return resError({ res, title: "Device not found", statusCode: 404 });
    if (!device.roomId) return resError({ res, title: "Device is not assigned to a room", statusCode: 400 });
    if (!user) return resError({ res, title: "Target user not found", statusCode: 404 });
    
    const { createEnrollmentSessionId, buildEnrollmentCommand } = require("../../services/webEnrollment");
    const sessionId = createEnrollmentSessionId("face");
    const command = buildEnrollmentCommand({ method: "face", deviceId, userId: user.id, username: user.username, sessionId });
    
    MQTTRegistrationBridge.trackFaceEnrollment({ deviceId, sessionId, userId: user.id, roomId: device.roomId });
    
    try {
      await MQTTConnection.publish(`doorlock/${deviceId}/face/enroll/context`, { ...command.payload, requested_by: getUser(req) });
      await MQTTConnection.publish(command.topic, command.payload);
    } catch (publishError) {
      MQTTRegistrationBridge.consumeFaceEnrollment(deviceId, sessionId);
      throw publishError;
    }
    
    return resSuccess({ res, title: "Face enrollment initiated", data: { sessionId, status: "waiting_for_device" } });
  } catch (error) {
    return resError({ res, title: "Failed to initiate face enrollment", errors: error.message });
  }
};

exports.getLatestCapture = async (req, res) => {
  try {
    if (!fs.existsSync(CAPTURE_DIR)) {
      fs.mkdirSync(CAPTURE_DIR, { recursive: true });
      return resSuccess({ res, title: "No captures yet", data: null });
    }

    const MAX_CAPTURES = 10;
    
    // Baca semua file gambar
    const files = fs.readdirSync(CAPTURE_DIR)
      .filter(file => /\.(jpg|jpeg|png)$/i.test(file))
      .map(file => {
        const filePath = path.join(CAPTURE_DIR, file);
        const stats = fs.statSync(filePath);
        return {
          filename: file,
          path: `/capture/${file}`,
          fullPath: filePath,
          timestamp: stats.mtimeMs
        };
      })
      .sort((a, b) => b.timestamp - a.timestamp); // Terbaru dulu

    // Hapus foto lama jika lebih dari MAX_CAPTURES
    if (files.length > MAX_CAPTURES) {
      const filesToDelete = files.slice(MAX_CAPTURES);
      filesToDelete.forEach(file => {
        try {
          fs.unlinkSync(file.fullPath);
          console.log(`[Face Capture] Deleted old capture: ${file.filename}`);
        } catch (deleteError) {
          console.error(`[Face Capture] Failed to delete ${file.filename}:`, deleteError.message);
        }
      });
    }

    if (files.length === 0) {
      return resSuccess({ res, title: "No captures found", data: null });
    }

    // Return foto terbaru (sudah di-sort)
    return resSuccess({ res, title: "Latest capture retrieved", data: files[0] });
  } catch (error) {
    return resError({ res, title: "Failed to get latest capture", errors: error.message });
  }
};
const prisma = require("../../prisma/client");
const { getUser } = require("../../services/auth");
const { resSuccess, resError } = require("../../services/responseHandler");
const { MQTTConnection } = require("../../connection/mqtt");

exports.registerFingerprintMapping = async (req, res) => {
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
    const { MQTTRegistrationBridge } = require("../../services/mqttRegistrationBridge");
    const sessionId = createEnrollmentSessionId("fingerprint");
    const command = buildEnrollmentCommand({ method: "fingerprint", deviceId, userId: user.id, username: user.username, sessionId });
    MQTTRegistrationBridge.trackEnrollment({ deviceId, sessionId, userId: user.id, roomId: device.roomId, method: "fingerprint" });
    try {
      await MQTTConnection.publish(command.topic, command.payload);
    } catch (publishError) {
      MQTTRegistrationBridge.consumeEnrollment(deviceId, sessionId, "fingerprint", user.id);
      throw publishError;
    }
    return resSuccess({ res, title: "Fingerprint enrollment initiated", data: { sessionId, status: "waiting_for_device" } });
  } catch (error) { return resError({ res, title: "Failed to initiate fingerprint enrollment", errors: error.message }); }
};

exports.listFingerprints = async (req, res) => {
  const { deviceId } = req.query;
  try {
    const mappings = await prisma.fingerprintMapping.findMany({
      where: deviceId ? { deviceId } : {},
      include: {
        user: { select: { username: true } },
        room: { select: { ruid: true, name: true } }
      },
      orderBy: { createdAt: 'desc' }
    });

    const formatted = mappings.map(m => ({
      id: m.id,
      deviceId: m.deviceId,
      fingerId: m.fingerId,
      username: m.user.username,
      roomRuid: m.room.ruid,
      roomName: m.room.name,
      isActive: m.isActive,
      createdAt: m.createdAt
    }));
    return resSuccess({
      res,
      title: "Fingerprint mappings retrieved",
      data: formatted
    });
  } catch (error) {
    return resError({
      res,
      title: "Failed to retrieve fingerprint mappings",
      errors: error.message
    });
  }
};

exports.listUserFingerprints = async (req, res) => {
  const userId = getUser(req);
  try {
    const mappings = await prisma.fingerprintMapping.findMany({
      where: { userId },
      include: {
        room: { select: { ruid: true, name: true } }
      },
      orderBy: { createdAt: 'desc' }
    });

    const formatted = mappings.map(m => ({
      id: m.id,
      deviceId: m.deviceId,
      fingerId: m.fingerId,
      roomRuid: m.room.ruid,
      roomName: m.room.name,
      isActive: m.isActive,
      createdAt: m.createdAt
    }));

    return resSuccess({
      res,
      title: "User fingerprint mappings retrieved",
      data: formatted
    });
  } catch (error) {
    return resError({
      res,
      title: "Failed to retrieve user fingerprint mappings",
      errors: error.message
    });
  }
};

exports.updateFingerprintMapping = async (req, res) => {
  const { id } = req.params;
  const { isActive } = req.body;
  const userId = getUser(req);

  try {
    const existing = await prisma.fingerprintMapping.findFirst({
      where: { id }
    });

    if (!existing) {
      return resError({ res, title: "Fingerprint mapping not found", statusCode: 404 });
    }

    const updated = await prisma.fingerprintMapping.update({
      where: { id },
      data: { isActive: isActive !== undefined ? isActive : existing.isActive },
      include: {
        user: { select: { username: true } },
        room: { select: { ruid: true, name: true } }
      }
    });

    // === TAMBAHKAN LOGIKA MQTT INI ===
    if (isActive === false) {
      const payload = {
        action: "disable_fingerprint",
        fingerId: updated.fingerId
      };
      
      MQTTConnection.publish(
        `doorlock/${updated.deviceId}/command`, // Kirim ke device yang bersangkutan
        payload
      );
      console.log(`[MQTT] Sent disable fingerprint command to ${updated.deviceId}`);

}
    // ================================

    return resSuccess({
      res,
      title: "Fingerprint mapping updated",
      data: {
        id: updated.id,
        fingerId: updated.fingerId,
        isActive: updated.isActive,
        updatedAt: updated.updatedAt
      }
    });
  } catch (error) {
    return resError({ res, title: "Failed to update fingerprint mapping", errors: error.message });
  }
};

exports.deleteFingerprintMapping = async (req, res) => {
  const { id } = req.params;
  const userId = getUser(req);

  try {
    const existing = await prisma.fingerprintMapping.findFirst({
      where: { id, userId } 
    });

    if (!existing) {
      return resError({ res, title: "Fingerprint mapping not found or unauthorized", statusCode: 404 });
    }

    // === TAMBAHKAN LOGIKA MQTT INI SEBELUM DIHAPUS DARI DB ===
    const payload = {
      action: "delete_fingerprint",
      fingerId: existing.fingerId
    };
    
    MQTTConnection.publish(
      `doorlock/${existing.deviceId}/command`,
      payload
    );
    console.log(`[MQTT] Sent delete fingerprint command to ${existing.deviceId}`);
    // ==========================================================

    await prisma.fingerprintMapping.delete({ where: { id } });

    return resSuccess({ res, title: "Fingerprint mapping deleted successfully" });
  } catch (error) {
    return resError({ res, title: "Failed to delete fingerprint mapping", errors: error.message });
  }
};

exports.getFingerprintDetail = async (req, res) => {
  const { id } = req.params;
  try {
    const mapping = await prisma.fingerprintMapping.findUnique({
      where: { id },
      include: {
        user: { select: { username: true, email: true } },
        room: { select: { ruid: true, name: true } }
      }
    });

    if (!mapping) {
      return resError({ res, title: "Mapping not found", statusCode: 404 });
    }

    return resSuccess({
      res,
      title: "Fingerprint mapping detail retrieved",
      data: mapping
    });
  } catch (error) {
    return resError({
      res,
      title: "Failed to retrieve fingerprint detail",
      errors: error.message
    });
  }
};

exports.getUserFingerprintDetail = async (req, res) => {
  const { id } = req.params;
  const userId = getUser(req);

  try {
    const mapping = await prisma.fingerprintMapping.findFirst({
      where: { id, userId },
      include: {
        room: { select: { ruid: true, name: true } }
      }
    });

    if (!mapping) {
      return resError({ res, title: "Mapping not found or unauthorized", statusCode: 404 });
    }

    return resSuccess({
      res,
      title: "User fingerprint detail retrieved",
      data: mapping
    });
  } catch (error) {
    return resError({
      res,
      title: "Failed to retrieve user fingerprint detail",
      errors: error.message
    });
  }
};

// exports.handleFingerprintAuth = async (deviceId, fingerId) => {
//   try {
//     const mapping = await prisma.fingerprintMapping.findFirst({
//       where: {
//         deviceId,
//         fingerId: parseInt(fingerId, 10),
//         isActive: true
//       },
//       include: {
//         user: { select: { username: true } },
//         room: { select: { id: true, ruid: true, name: true } }
//       }
//     });

//     if (!mapping) {
//       console.log(`[MQTT Auth] Fingerprint ID ${fingerId} on device ${deviceId} not mapped or inactive`);
//       return { success: false, reason: "Fingerprint not registered or inactive" };
//     }
//     await prisma.rooms_Records.create({
//       data: {
//         roomId: mapping.room.id,
//         cardId: null, // Standalone auth
//         unregisteredCard: null,
//         isSuccess: true
//       }
//     });
//     console.log(`[MQTT Auth] Access granted: ${mapping.user.username} via fingerprint #${fingerId} at ${mapping.room.name}`);
//     return {
//       success: true,
//       username: mapping.user.username,
//       roomRuid: mapping.room.ruid,
//       roomName: mapping.room.name
//     };
//   } catch (error) {
//     console.error("[MQTT Auth] Error handling fingerprint auth:", error);
//     return { success: false, reason: "Internal database error" };
//   }
// };
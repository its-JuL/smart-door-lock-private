const prisma = require("../../prisma/client");
const { getUser } = require("../../services/auth");
const { resSuccess, resError } = require("../../services/responseHandler");
const { MQTTConnection } = require("../../connection/mqtt"); 

// exports.registerFingerprintMapping = async (req, res) => {
//   const { deviceId, fingerId, ruid, targetUserId } = req.body;
//   const userId = targetUserId || getUser(req);
//   try {
//     const room = await prisma.room.findUnique({
//       where: { ruid },
//       select: { id: true, name: true }
//     });
//     if (!room) {
//       return resError({ res, title: "Room not found", statusCode: 404 });
//     }
//     const existing = await prisma.fingerprintMapping.findFirst({
//       where: { deviceId, fingerId }
//     });
//     if (existing) {
//       return resError({
//         res,
//         title: "Fingerprint ID already mapped to another user on this device",
//         statusCode: 409
//       });
//     }
//     const mapping = await prisma.fingerprintMapping.create({
//       data: {
//         deviceId,
//         fingerId: parseInt(fingerId, 10), // Pastikan tipe data Integer
//         userId,
//         roomId: room.id,
//         isActive: true
//       },
//       include: {
//         user: { select: { username: true } },
//         room: { select: { ruid: true, name: true } }
//       }
//     });
//     return resSuccess({
//       res,
//       title: "Fingerprint mapping registered",
//       data: {
//         id: mapping.id,
//         deviceId: mapping.deviceId,
//         fingerId: mapping.fingerId,
//         username: mapping.user.username,
//         roomRuid: mapping.room.ruid,
//         roomName: mapping.room.name,
//         isActive: mapping.isActive
//       }
//     });
//   } catch (error) {
//     return resError({
//       res,
//       title: "Failed to register fingerprint mapping",
//       errors: error.message
//     });
//   }
// };

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
      
      MQTTConnection.sendMessage(
        JSON.stringify(payload),
        `doorlock/${updated.deviceId}/command` // Kirim ke device yang bersangkutan
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
    
    MQTTConnection.sendMessage(
      JSON.stringify(payload),
      `doorlock/${existing.deviceId}/command`
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
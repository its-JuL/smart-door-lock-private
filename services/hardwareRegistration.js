const crypto = require("crypto");

const sha256Pin = (pin) => crypto.createHash("sha256").update(String(pin)).digest("hex");

function buildUserSearchResult({ sessionId, users }) {
  return {
    session_id: sessionId,
    success: true,
    detail: `${users.length} user(s) found`,
    results: users.map((user) => ({ user_id: user.id, username: user.username })),
  };
}

function buildAuthRegistrationPlan({ device, payload }) {
  if (!device?.device_id || !device?.roomId) throw new Error("Device is not assigned to a room");
  if (!payload?.user_id) throw new Error("user_id is required");
  const method = String(payload.method || "").toLowerCase();
  const common = { deviceId: device.device_id, roomId: device.roomId, userId: payload.user_id, sessionId: payload.session_id };
  if (method === "fingerprint") {
    const fingerId = Number.parseInt(payload.finger_id, 10);
    if (!Number.isInteger(fingerId) || fingerId < 1) throw new Error("Valid finger_id is required");
    return { kind: "fingerprint", ...common, fingerId };
  }
  if (method === "rfid") {
    const cardNumber = String(payload.card_number || "").replaceAll(" ", "");
    if (!cardNumber) throw new Error("card_number is required");
    return { kind: "rfid", ...common, cardNumber };
  }
  if (method === "pin") {
    const devicePinHash = String(payload.pin_hash || "").toLowerCase();
    if (!/^[a-f0-9]{64}$/.test(devicePinHash)) throw new Error("Valid SHA-256 pin_hash is required");
    return { kind: "pin", ...common, devicePinHash };
  }
  throw new Error(`Unsupported registration method: ${method || "missing"}`);
}

function buildManualCredentialSyncPlan({ device, payload }) {
  if (!device?.device_id || !device?.roomId) throw new Error("Device is not assigned to a room");
  const userId = String(payload?.targetUserId || "").trim();
  if (!userId) throw new Error("targetUserId is required");
  const method = String(payload?.method || "").toLowerCase();
  const common = { deviceId: device.device_id, roomId: device.roomId, userId };
  if (method === "fingerprint") {
    const fingerId = Number.parseInt(payload.fingerId, 10);
    if (!Number.isInteger(fingerId) || fingerId < 2 || fingerId > 127) throw new Error("Valid user fingerId (2-127) is required");
    return { kind: "fingerprint", ...common, fingerId };
  }
  if (method === "rfid") {
    const cardNumber = String(payload.cardNumber || "").replaceAll(" ", "").trim().toUpperCase();
    if (!cardNumber) throw new Error("cardNumber is required");
    return { kind: "rfid", ...common, cardNumber };
  }
  throw new Error(`Unsupported manual sync method: ${method || "missing"}`);
}

module.exports = { sha256Pin, buildUserSearchResult, buildAuthRegistrationPlan, buildManualCredentialSyncPlan };

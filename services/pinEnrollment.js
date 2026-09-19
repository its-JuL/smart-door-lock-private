const crypto = require("crypto");
function sha256Pin(pin) { return crypto.createHash("sha256").update(String(pin)).digest("hex"); }
function buildPinEnrollmentPlan({ device, targetUserId, pin, sessionId = undefined }) {
  if (!device || !device.device_id) throw new Error("device is required");
  if (!targetUserId) throw new Error("targetUserId is required");
  if (!/^\d{6}$/.test(String(pin))) throw new Error("PIN must contain exactly 6 digits");
  const devicePinHash = sha256Pin(pin);
  return { userId: targetUserId, deviceId: device.device_id, devicePinHash, command: { action: "upsert_user_pin", user_id: targetUserId, ...(sessionId ? { session_id: sessionId } : {}), pin_hash: devicePinHash } };
}
module.exports = { sha256Pin, buildPinEnrollmentPlan };

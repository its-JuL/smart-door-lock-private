const crypto = require("crypto");

const ACTIONS = Object.freeze({
  fingerprint: "enroll_fingerprint",
  rfid: "enroll_rfid",
  face: "enroll_face",
});

function createEnrollmentSessionId(method) {
  if (!ACTIONS[method]) throw new Error(`Unsupported enrollment method: ${method}`);
  return `${method}_${Date.now()}_${crypto.randomBytes(4).toString("hex")}`;
}

function buildEnrollmentCommand({ method, deviceId, userId, username = "", sessionId }) {
  if (!ACTIONS[method]) throw new Error(`Unsupported enrollment method: ${method}`);
  if (!deviceId) throw new Error("deviceId is required");
  if (!userId) throw new Error("userId is required");
  if (!sessionId) throw new Error("sessionId is required");
  return {
    topic: `doorlock/${deviceId}/command`,
    payload: {
      action: ACTIONS[method],
      session_id: sessionId,
      user_id: userId,
      username: String(username || ""),
    },
  };
}

module.exports = { createEnrollmentSessionId, buildEnrollmentCommand };

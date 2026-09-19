const assert = require("assert");
const { buildEnrollmentCommand, createEnrollmentSessionId } = require("../services/webEnrollment");

(function testBuildsFingerprintCommandWithCorrelation() {
  const command = buildEnrollmentCommand({
    method: "fingerprint", deviceId: "main_esp32_01", userId: "user-1", username: "andi", sessionId: "fp_123"
  });
  assert.deepStrictEqual(command, {
    topic: "doorlock/main_esp32_01/command",
    payload: { action: "enroll_fingerprint", session_id: "fp_123", user_id: "user-1", username: "andi" }
  });
})();

(function testBuildsRfidAndFaceCommands() {
  assert.strictEqual(buildEnrollmentCommand({ method: "rfid", deviceId: "d", userId: "u", username: "n", sessionId: "s" }).payload.action, "enroll_rfid");
  assert.strictEqual(buildEnrollmentCommand({ method: "face", deviceId: "d", userId: "u", username: "n", sessionId: "s" }).payload.action, "enroll_face");
})();

(function testRejectsInvalidEnrollmentData() {
  assert.throws(() => buildEnrollmentCommand({ method: "pin", deviceId: "d", userId: "u", sessionId: "s" }), /Unsupported/);
  assert.throws(() => buildEnrollmentCommand({ method: "face", deviceId: "", userId: "u", sessionId: "s" }), /deviceId/);
  assert.throws(() => buildEnrollmentCommand({ method: "face", deviceId: "d", userId: "", sessionId: "s" }), /userId/);
  assert.throws(() => buildEnrollmentCommand({ method: "face", deviceId: "d", userId: "u", sessionId: "" }), /sessionId/);
})();

(function testSessionIdsAreMethodPrefixedAndUnique() {
  const first = createEnrollmentSessionId("fingerprint");
  const second = createEnrollmentSessionId("fingerprint");
  assert.match(first, /^fingerprint_[0-9]+_[a-z0-9]+$/);
  assert.notStrictEqual(first, second);
})();

console.log("webEnrollment tests: PASS");

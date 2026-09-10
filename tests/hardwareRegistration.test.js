const assert = require("assert");
const {
  sha256Pin,
  buildUserSearchResult,
  buildAuthRegistrationPlan,
} = require("../services/hardwareRegistration");

(function testSearchKeepsSessionAndLimitsUsers() {
  const result = buildUserSearchResult({
    deviceId: "main_esp32_01", sessionId: 42, users: [
      { id: "u1", username: "andi" }, { id: "u2", username: "ani" }
    ]
  });
  assert.deepStrictEqual(result, {
    session_id: 42,
    success: true,
    detail: "2 user(s) found",
    results: [{ user_id: "u1", username: "andi" }, { user_id: "u2", username: "ani" }]
  });
})();

(function testFingerprintPlanUsesDeviceRoomAndSelectedUser() {
  const plan = buildAuthRegistrationPlan({
    device: { device_id: "main_esp32_01", roomId: "room-1" },
    payload: { method: "fingerprint", user_id: "user-1", finger_id: 7, session_id: 55 }
  });
  assert.deepStrictEqual(plan, {
    kind: "fingerprint", deviceId: "main_esp32_01", roomId: "room-1",
    userId: "user-1", fingerId: 7, sessionId: 55
  });
})();

(function testPinHashMatchesEsp32Sha256Format() {
  assert.strictEqual(sha256Pin("123456"), "8d969eef6ecad3c29a3a629280e686cf0c3f5d5a86aff3ca12020c923adc6c92");
})();

(function testRejectsUnknownMethodAndInvalidFingerprint() {
  assert.throws(() => buildAuthRegistrationPlan({ device: { device_id: "d", roomId: "r" }, payload: { method: "face", user_id: "u" } }), /Unsupported/);
  assert.throws(() => buildAuthRegistrationPlan({ device: { device_id: "d", roomId: "r" }, payload: { method: "fingerprint", user_id: "u", finger_id: 0 } }), /finger_id/);
})();

console.log("hardwareRegistration tests: PASS");

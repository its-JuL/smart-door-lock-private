const assert = require("assert");
const { MQTTRegistrationBridge } = require("../services/mqttRegistrationBridge");

(function testSessionRequiresMatchingDeviceMethodAndUser() {
  MQTTRegistrationBridge.trackEnrollment({
    deviceId: "main_esp32_01", sessionId: "fp-session", userId: "user-1", roomId: "room-1", method: "fingerprint"
  });
  assert.strictEqual(MQTTRegistrationBridge.getEnrollment("other-device", "fp-session", "fingerprint", "user-1"), null);
  assert.strictEqual(MQTTRegistrationBridge.getEnrollment("main_esp32_01", "fp-session", "rfid", "user-1"), null);
  assert.strictEqual(MQTTRegistrationBridge.getEnrollment("main_esp32_01", "fp-session", "fingerprint", "user-2"), null);
  assert.deepStrictEqual(MQTTRegistrationBridge.getEnrollment("main_esp32_01", "fp-session", "fingerprint", "user-1"), {
    deviceId: "main_esp32_01", sessionId: "fp-session", userId: "user-1", roomId: "room-1", method: "fingerprint"
  });
})();

(function testSessionIsConsumedOnlyAfterSuccessfulPersistence() {
  MQTTRegistrationBridge.trackEnrollment({
    deviceId: "main_esp32_01", sessionId: "rfid-session", userId: "user-1", roomId: "room-1", method: "rfid"
  });
  assert.notStrictEqual(MQTTRegistrationBridge.getEnrollment("main_esp32_01", "rfid-session", "rfid", "user-1"), null);
  assert.notStrictEqual(MQTTRegistrationBridge.consumeEnrollment("main_esp32_01", "rfid-session", "rfid", "user-1"), null);
  assert.strictEqual(MQTTRegistrationBridge.getEnrollment("main_esp32_01", "rfid-session", "rfid", "user-1"), null);
})();

console.log("enrollment session tests: PASS");

const assert = require("assert");
const { MQTTRegistrationBridge } = require("../services/mqttRegistrationBridge");
const realNow = Date.now;
try {
  let now = 1_000_000;
  Date.now = () => now;
  MQTTRegistrationBridge.trackEnrollment({ deviceId: "main_esp32_01", sessionId: "fingerprint_regression", userId: "user-1", roomId: "room-1", method: "fingerprint" });
  now += 90_000;
  assert.deepStrictEqual(
    MQTTRegistrationBridge.getEnrollment("main_esp32_01", "fingerprint_regression", "fingerprint", "user-1"),
    { deviceId: "main_esp32_01", sessionId: "fingerprint_regression", userId: "user-1", roomId: "room-1", method: "fingerprint" },
    "A fingerprint enrollment must remain correlated for at least 90 seconds; the physical two-scan flow can exceed one minute."
  );
  console.log("fingerprint enrollment timeout regression: PASS");
} finally { Date.now = realNow; }

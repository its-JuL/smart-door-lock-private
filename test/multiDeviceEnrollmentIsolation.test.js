const test = require("node:test");
const assert = require("node:assert/strict");
const { MQTTRegistrationBridge } = require("../services/mqttRegistrationBridge");

const first = {
  deviceId: "main_esp32_01",
  sessionId: "face-session-01",
  userId: "user-01",
  roomId: "room-01",
  method: "face",
};
const second = {
  deviceId: "main_esp32_02",
  sessionId: "face-session-02",
  userId: "user-02",
  roomId: "room-02",
  method: "face",
};

test("simultaneous enrollment state remains isolated by logical device and session", () => {
  MQTTRegistrationBridge.trackEnrollment(first);
  MQTTRegistrationBridge.trackEnrollment(second);

  assert.equal(
    MQTTRegistrationBridge.getEnrollment(first.deviceId, first.sessionId, first.method, first.userId).roomId,
    first.roomId
  );
  assert.equal(
    MQTTRegistrationBridge.getEnrollment(second.deviceId, second.sessionId, second.method, second.userId).roomId,
    second.roomId
  );
  assert.equal(
    MQTTRegistrationBridge.getEnrollment(second.deviceId, first.sessionId, first.method, first.userId),
    null
  );

  assert.equal(
    MQTTRegistrationBridge.consumeEnrollment(first.deviceId, first.sessionId, first.method, first.userId).deviceId,
    first.deviceId
  );
  assert.equal(
    MQTTRegistrationBridge.getEnrollment(second.deviceId, second.sessionId, second.method, second.userId).deviceId,
    second.deviceId
  );
  MQTTRegistrationBridge.consumeEnrollment(second.deviceId, second.sessionId, second.method, second.userId);
});

test("face enrollment tracker permits the same session token on different devices", () => {
  const sharedSession = "shared-session";
  MQTTRegistrationBridge.trackFaceEnrollment({ ...first, sessionId: sharedSession });
  MQTTRegistrationBridge.trackFaceEnrollment({ ...second, sessionId: sharedSession });

  assert.equal(
    MQTTRegistrationBridge.consumeFaceEnrollment(first.deviceId, sharedSession).userId,
    first.userId
  );
  assert.equal(
    MQTTRegistrationBridge.consumeFaceEnrollment(second.deviceId, sharedSession).userId,
    second.userId
  );
});

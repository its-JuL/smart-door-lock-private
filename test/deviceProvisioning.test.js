const test = require("node:test");
const assert = require("node:assert/strict");
const {
  normalizeDoorDeviceId,
  buildDeviceProvisioningData,
} = require("../services/deviceProvisioning");

test("normalizes a valid logical door ID", () => {
  assert.equal(normalizeDoorDeviceId("  MAIN_ESP32_02  "), "main_esp32_02");
});

test("rejects an ID outside the firmware-safe MQTT format", () => {
  assert.throws(() => normalizeDoorDeviceId("Door 2/utama"), /lowercase letters, numbers, and underscores/);
});

test("rejects an ID longer than the ESP-NOW device field", () => {
  assert.throws(() => normalizeDoorDeviceId(`main_${"x".repeat(27)}`), /31 characters/);
});

test("builds unique main and camera identities for provisioning", () => {
  assert.deepEqual(buildDeviceProvisioningData("main_esp32_02"), {
    doorDeviceId: "main_esp32_02",
    cameraDeviceId: "esp32cam_02",
    mainMqttClientId: "main_esp32_02",
    cameraMqttClientId: "esp32cam_02",
  });
});

const test = require("node:test");
const assert = require("node:assert/strict");
const fs = require("node:fs");

const mainPath = "C:/Users/JuL/Documents/Project/Hardwarev2/main_esp32_fixed_MQTT_v5.ino";
const cameraPath = "C:/Users/JuL/Documents/Project/Hardwarev2/esp32cam_uart_relay_v5.ino";

const main = fs.readFileSync(mainPath, "utf8");
const camera = fs.readFileSync(cameraPath, "utf8");

test("main firmware derives all MQTT topics from one door ID", () => {
  assert.match(main, /#define DOOR_DEVICE_ID "main_esp32_01"/);
  assert.match(main, /"doorlock\/" DOOR_DEVICE_ID "\/camera\/result"/);
  assert.match(main, /"doorlock\/" DOOR_DEVICE_ID "\/command"/);
  assert.doesNotMatch(main, /"doorlock\/main_esp32_01\//);
});

test("camera firmware derives topics and MQTT identity from provisioning IDs", () => {
  assert.match(camera, /#define PARENT_DOOR_DEVICE_ID "main_esp32_01"/);
  assert.match(camera, /#define CAMERA_DEVICE_ID "esp32cam_01"/);
  assert.match(camera, /static const char MQTT_CLIENT_ID\[\] = CAMERA_DEVICE_ID/);
  assert.match(camera, /static const char DEVICE_ID\[\] = PARENT_DOOR_DEVICE_ID/);
  assert.doesNotMatch(camera, /"doorlock\/main_esp32_01\//);
});

test("ESP-NOW contract is equal and camera filters another door trigger", () => {
  assert.match(main, /char deviceId\[32\]/);
  assert.match(camera, /char deviceId\[32\]/);
  assert.match(camera, /strncmp\(msg\.deviceId, PARENT_DOOR_DEVICE_ID/);
});

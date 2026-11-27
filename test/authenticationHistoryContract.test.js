const test = require("node:test");
const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");

const root = path.resolve(__dirname, "..");
const read = (relativePath) => fs.readFileSync(path.join(root, relativePath), "utf8");

test("Prisma access records keep device, detail, and capture evidence", () => {
  const schema = read("prisma/schema.prisma");
  const block = schema.match(/model Rooms_Records\s*\{[\s\S]*?\n\}/)?.[0] || "";

  assert.match(block, /deviceId\s+String\?/);
  assert.match(block, /device\s+Device\?/);
  assert.match(block, /detail\s+String\?/);
  assert.match(block, /capturePath\s+String\?/);
  assert.match(block, /@@index\(\[deviceId, createdAt\]\)/);
});

test("device exposes its authentication history relation", () => {
  const schema = read("prisma/schema.prisma");
  const block = schema.match(/model Device\s*\{[\s\S]*?\n\}/)?.[0] || "";

  assert.match(block, /accessRecords\s+Rooms_Records\[\]/);
});

test("face capture endpoint requires a device filter", () => {
  const router = read("api_face/v1/router.js");
  const controller = read("api_face/v1/controller_face.js");

  assert.match(router, /latest-capture\/:(?:deviceId|device_id)/);
  assert.match(router, /requireAssignedDevice/);
  assert.match(controller, /req\.params\.(?:deviceId|device_id)/);
});

test("face page offers a searchable hardware selector for preview", () => {
  const view = read("views/faceRecognition.handlebars");
  const client = read("public/js/credentials.js");

  assert.match(view, /id="face-preview-device"/);
  assert.match(view, /list="managed-device-options"/);
  assert.match(client, /face-preview-device/);
  assert.match(client, /latest-capture\/\$\{encodeURIComponent\(deviceId\)\}/);
});

test("authentication history API returns user room and hardware context", () => {
  const controller = read("api_room_record/v1/controller.js");

  assert.match(controller, /deviceId/);
  assert.match(controller, /authenticationMethod/);
  assert.match(controller, /isSuccess/);
  assert.match(controller, /include:\s*\{[\s\S]*user:/);
  assert.match(controller, /device:/);
});

test("dashboard exposes a unified authentication history page", () => {
  const router = read("app_dashboard/router.js");
  const controller = read("app_dashboard/dashboardControllers.js");
  const view = read("views/authenticationHistory.handlebars");
  const client = read("public/js/authenticationHistory.js");

  assert.match(router, /\/authentication\/history/);
  assert.match(controller, /authenticationHistory/);
  assert.match(controller, /authenticationHistory\.js/);
  assert.match(view, /id="authentication-history-list"/);
  assert.match(view, /data-list-endpoint="\/api\/v1\/room-record\/logs"/);
  assert.match(view, /name="authenticationMethod"/);
  assert.match(view, /name="isSuccess"/);
  assert.match(client, /URLSearchParams/);
  assert.match(client, /capturePath/);
});

test("MQTT logger persists event detail and face capture evidence", () => {
  const logger = read("services/mqttLogger.js");

  assert.match(logger, /detail/);
  assert.match(logger, /capture_path/);
  assert.match(logger, /deviceId/);
});

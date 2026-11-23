const test = require("node:test");
const assert = require("node:assert/strict");
const fs = require("node:fs");
const os = require("node:os");
const path = require("node:path");

test("production startup memuat nilai .env terbaru menggantikan environment PM2 lama", () => {
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), "doorlock-env-"));
  const envPath = path.join(dir, ".env");
  fs.writeFileSync(envPath, "MQTT_HOST=broker-terbaru.example\nMQTT_PORT=1884\n");

  const previousHost = process.env.MQTT_HOST;
  const previousPort = process.env.MQTT_PORT;
  process.env.MQTT_HOST = "broker-lama.example";
  process.env.MQTT_PORT = "1883";

  try {
    const { loadEnvironment } = require("../services/environment");
    loadEnvironment(envPath);
    assert.equal(process.env.MQTT_HOST, "broker-terbaru.example");
    assert.equal(process.env.MQTT_PORT, "1884");
  } finally {
    if (previousHost === undefined) delete process.env.MQTT_HOST;
    else process.env.MQTT_HOST = previousHost;
    if (previousPort === undefined) delete process.env.MQTT_PORT;
    else process.env.MQTT_PORT = previousPort;
    fs.rmSync(dir, { recursive: true, force: true });
  }
});

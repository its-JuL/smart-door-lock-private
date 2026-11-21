const test = require("node:test");
const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");

test("hardware page exposes an authenticated device registration form", () => {
  const template = fs.readFileSync(path.join(__dirname, "../views/hardware.handlebars"), "utf8");
  const script = fs.readFileSync(path.join(__dirname, "../public/js/hardware.js"), "utf8");
  const router = fs.readFileSync(path.join(__dirname, "../api_room/v2/router.js"), "utf8");

  assert.match(template, /id="device-register-form"/);
  assert.match(template, /name="deviceId"/);
  assert.match(script, /\/api\/v2\/room\/device\/register/);
  assert.match(router, /"\/device\/register"/);
  assert.match(router, /allowedRole\("ADMIN"\)/);
});

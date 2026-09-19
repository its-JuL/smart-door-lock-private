const assert = require("assert");
const { buildPinEnrollmentPlan } = require("../services/pinEnrollment");
(function testPinEnrollmentTargetsUserAndDeviceNotRoom() {
  const plan = buildPinEnrollmentPlan({ device: { device_id: "main_esp32_01", roomId: "room-ignored" }, targetUserId: "user-1", pin: "123456" });
  assert.deepStrictEqual(plan, { userId: "user-1", deviceId: "main_esp32_01", devicePinHash: "8d969eef6ecad3c29a3a629280e686cf0c3f5d5a86aff3ca12020c923adc6c92", command: { action: "upsert_user_pin", user_id: "user-1", pin_hash: "8d969eef6ecad3c29a3a629280e686cf0c3f5d5a86aff3ca12020c923adc6c92" } });
})();
(function testPinEnrollmentRequiresUserDeviceAndSixDigitPin() {
  assert.throws(() => buildPinEnrollmentPlan({ device: null, targetUserId: "u", pin: "123456" }), /device/);
  assert.throws(() => buildPinEnrollmentPlan({ device: { device_id: "d" }, targetUserId: "", pin: "123456" }), /targetUserId/);
  assert.throws(() => buildPinEnrollmentPlan({ device: { device_id: "d" }, targetUserId: "u", pin: "123" }), /6 digits/);
})();
console.log("pin enrollment contract: PASS");

const test = require("node:test");
const assert = require("node:assert/strict");
const { buildAuthRegistrationPlan } = require("../services/hardwareRegistration");

test("buildAuthRegistrationPlan accepts correlated face enrollment", () => {
  assert.deepEqual(
    buildAuthRegistrationPlan({
      device: { device_id: "main_esp32_01", roomId: "room-1" },
      payload: {
        method: "face",
        user_id: "user-1",
        session_id: "face-session",
      },
    }),
    {
      kind: "face",
      deviceId: "main_esp32_01",
      roomId: "room-1",
      userId: "user-1",
      sessionId: "face-session",
    }
  );
});

const test = require("node:test");
const assert = require("node:assert/strict");
const { buildAccessRecordData } = require("../services/accessRecord");

test("buildAccessRecordData stores fingerprint method and mapped user", () => {
  assert.deepEqual(
    buildAccessRecordData({
      roomId: "room-1",
      userId: "user-1",
      method: "fingerprint",
      isSuccess: true,
    }),
    {
      roomId: "room-1",
      userId: "user-1",
      authenticationMethod: "FINGERPRINT",
      isSuccess: true,
    }
  );
});

test("buildAccessRecordData preserves known authentication methods", () => {
  assert.equal(buildAccessRecordData({ method: "RFID" }).authenticationMethod, "RFID");
  assert.equal(buildAccessRecordData({ method: "PIN" }).authenticationMethod, "PIN");
  assert.equal(buildAccessRecordData({ method: "camera" }).authenticationMethod, "FACE");
});

test("buildAccessRecordData labels an unknown event without inventing a user", () => {
  assert.deepEqual(
    buildAccessRecordData({ method: "exit button", isSuccess: true }),
    { authenticationMethod: "EXIT_BUTTON", isSuccess: true }
  );
});

const test = require("node:test");
const assert = require("node:assert/strict");

const {
  requireAssignedDevice,
  requireAssignedRoom,
} = require("../middlewares/scopeMiddlewares");

function responseRecorder() {
  return {
    statusCode: 200,
    payload: null,
    status(code) {
      this.statusCode = code;
      return this;
    },
    json(payload) {
      this.payload = payload;
      return this;
    },
  };
}

test("operator cannot use a device outside assigned buildings", () => {
  const req = {
    body: { deviceId: "door-2" },
    accessScope: { type: "ASSIGNED", deviceIds: ["door-1"] },
  };
  const res = responseRecorder();
  let continued = false;

  requireAssignedDevice(req, res, () => { continued = true; });

  assert.equal(continued, false);
  assert.equal(res.statusCode, 403);
  assert.equal(res.payload.success, false);
});

test("operator can use a device in assigned buildings", () => {
  const req = {
    body: { deviceId: "door-1" },
    accessScope: { type: "ASSIGNED", deviceIds: ["door-1"] },
  };
  const res = responseRecorder();
  let continued = false;

  requireAssignedDevice(req, res, () => { continued = true; });

  assert.equal(continued, true);
  assert.equal(res.payload, null);
});

test("operator cannot access a room outside assigned buildings", () => {
  const req = {
    params: { ruid: "R-999" },
    accessScope: { type: "ASSIGNED", roomIds: [], roomRuids: ["R-101"] },
  };
  const res = responseRecorder();

  requireAssignedRoom(req, res, () => assert.fail("must not continue"));

  assert.equal(res.statusCode, 403);
});

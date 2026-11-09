const test = require("node:test");
const assert = require("node:assert/strict");

const {
  deviceWhereForScope,
  roomWhereForScope,
  cardWhereForScope,
} = require("../services/operatorScope");

const assigned = {
  type: "ASSIGNED",
  deviceIds: ["door-1", "door-2"],
  roomIds: ["room-1", "room-2"],
};

test("assigned scope builds device filter from assigned devices", () => {
  assert.deepEqual(deviceWhereForScope(assigned), {
    deviceId: { in: ["door-1", "door-2"] },
  });
  assert.deepEqual(deviceWhereForScope(assigned, "door-2"), {
    deviceId: "door-2",
  });
});

test("assigned scope builds room and card filters from assigned rooms", () => {
  assert.deepEqual(roomWhereForScope(assigned), {
    id: { in: ["room-1", "room-2"] },
  });
  assert.deepEqual(cardWhereForScope(assigned), {
    room: { some: { id: { in: ["room-1", "room-2"] } } },
  });
});

test("all scope does not narrow queries unless a device was requested", () => {
  assert.deepEqual(deviceWhereForScope({ type: "ALL" }), {});
  assert.deepEqual(deviceWhereForScope({ type: "ALL" }, "door-9"), {
    deviceId: "door-9",
  });
  assert.deepEqual(roomWhereForScope({ type: "ALL" }), {});
  assert.deepEqual(cardWhereForScope({ type: "ALL" }), {});
});

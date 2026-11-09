const test = require("node:test");
const assert = require("node:assert/strict");

const {
  createAccessScope,
  canAccessDevice,
  canAccessRoom,
  canAccessCard,
} = require("../services/operatorScope");

test("operator access scope contains only assigned rooms and devices", () => {
  const scope = createAccessScope({
    userId: "operator-1",
    roleName: "OPERATOR",
    buildings: [
      {
        id: "building-1",
        rooms: [
          { id: "room-1", ruid: "R-101", device: { device_id: "door-1" } },
          { id: "room-2", ruid: "R-102", device: null },
        ],
      },
    ],
  });

  assert.equal(scope.type, "ASSIGNED");
  assert.deepEqual(scope.buildingIds, ["building-1"]);
  assert.deepEqual(scope.roomIds, ["room-1", "room-2"]);
  assert.deepEqual(scope.roomRuids, ["R-101", "R-102"]);
  assert.deepEqual(scope.deviceIds, ["door-1"]);
  assert.equal(canAccessDevice(scope, "door-1"), true);
  assert.equal(canAccessDevice(scope, "door-2"), false);
  assert.equal(canAccessRoom(scope, { ruid: "R-102" }), true);
  assert.equal(canAccessRoom(scope, { id: "room-9" }), false);
  assert.equal(canAccessCard(scope, { room: [{ id: "room-1" }] }), true);
  assert.equal(canAccessCard(scope, { room: [] }), false);
  assert.equal(canAccessCard(scope, { room: [{ id: "room-9" }] }), false);
});

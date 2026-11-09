const test = require("node:test");
const assert = require("node:assert/strict");

const { createAccessScopeLoader } = require("../middlewares/accessScopeMiddlewares");

test("access scope loader resolves OPERATOR assignments from Building.operator", async () => {
  const prisma = {
    user: {
      findUnique: async () => ({
        id: "operator-1",
        role: { name: "OPERATOR" },
        Building: [
          {
            id: "building-1",
            rooms: [
              { id: "room-1", ruid: "R-101", device: { device_id: "door-1" } },
            ],
          },
        ],
      }),
    },
  };
  const loadAccessScope = createAccessScopeLoader({
    prisma,
    getUser: () => "operator-1",
  });
  const req = {};
  let continued = false;

  await loadAccessScope(req, {}, () => { continued = true; });

  assert.equal(continued, true);
  assert.equal(req.accessScope.type, "ASSIGNED");
  assert.deepEqual(req.accessScope.buildingIds, ["building-1"]);
  assert.deepEqual(req.accessScope.roomRuids, ["R-101"]);
  assert.deepEqual(req.accessScope.deviceIds, ["door-1"]);
});

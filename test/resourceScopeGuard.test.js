const test = require("node:test");
const assert = require("node:assert/strict");

const { createResourceScopeGuard } = require("../middlewares/scopeMiddlewares");

function responseRecorder() {
  return {
    statusCode: 200,
    payload: null,
    status(code) { this.statusCode = code; return this; },
    json(payload) { this.payload = payload; return this; },
  };
}

const assigned = {
  type: "ASSIGNED",
  roomIds: ["room-1"],
  roomRuids: ["R-101"],
  deviceIds: ["door-1"],
};

test("resource guard rejects an ID that resolves outside operator scope", async () => {
  const guard = createResourceScopeGuard({
    resolveResource: async () => ({ deviceId: "door-2" }),
    isAllowed: (scope, resource) => scope.deviceIds.includes(resource.deviceId),
    title: "Credential is outside your assigned scope",
  });
  const req = { params: { id: "credential-2" }, accessScope: assigned };
  const res = responseRecorder();
  let continued = false;

  await guard(req, res, () => { continued = true; });

  assert.equal(continued, false);
  assert.equal(res.statusCode, 403);
  assert.equal(res.payload.message, "Credential is outside your assigned scope");
});

test("resource guard permits an ID that resolves inside operator scope", async () => {
  const guard = createResourceScopeGuard({
    resolveResource: async () => ({ deviceId: "door-1" }),
    isAllowed: (scope, resource) => scope.deviceIds.includes(resource.deviceId),
  });
  const req = { params: { id: "credential-1" }, accessScope: assigned };
  const res = responseRecorder();
  let continued = false;

  await guard(req, res, () => { continued = true; });

  assert.equal(continued, true);
  assert.equal(res.payload, null);
});

test("resource guard returns 404 when the referenced resource does not exist", async () => {
  const guard = createResourceScopeGuard({
    resolveResource: async () => null,
    isAllowed: () => true,
  });
  const res = responseRecorder();

  await guard({ params: { id: "missing" }, accessScope: assigned }, res, () => {
    assert.fail("must not continue");
  });

  assert.equal(res.statusCode, 404);
});

test("ALL scope bypasses assignment checks", async () => {
  const guard = createResourceScopeGuard({
    resolveResource: async () => ({ deviceId: "door-9" }),
    isAllowed: () => false,
  });
  let continued = false;

  await guard({ accessScope: { type: "ALL" } }, responseRecorder(), () => {
    continued = true;
  });

  assert.equal(continued, true);
});

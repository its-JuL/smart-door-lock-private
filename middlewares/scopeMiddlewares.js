const { resError } = require("../services/responseHandler");
const { canAccessDevice, canAccessRoom } = require("../services/operatorScope");

function requireAssignedDevice(req, res, next) {
  const deviceId = req.params?.deviceId || req.body?.deviceId || req.query?.deviceId;
  if (!canAccessDevice(req.accessScope, deviceId)) {
    return resError({ res, code: 403, title: "Device is outside your assigned scope" });
  }
  return next();
}

function requireAssignedRoom(req, res, next) {
  const ruid = req.params?.ruid || req.body?.ruid || req.query?.ruid;
  if (!canAccessRoom(req.accessScope, { ruid })) {
    return resError({ res, code: 403, title: "Room is outside your assigned scope" });
  }
  return next();
}

function createResourceScopeGuard({ resolveResource, isAllowed, title = "Resource is outside your assigned scope" }) {
  return async (req, res, next) => {
    try {
      if (req.accessScope?.type === "ALL") return next();

      const resource = await resolveResource(req);
      if (!resource) {
        return resError({ res, code: 404, title: "Resource was not found" });
      }
      if (!isAllowed(req.accessScope, resource)) {
        return resError({ res, code: 403, title });
      }
      req.scopedResource = resource;
      return next();
    } catch (errors) {
      return resError({
        res,
        code: 500,
        title: "Failed to verify resource scope",
        errors,
      });
    }
  };
}

module.exports = {
  requireAssignedDevice,
  requireAssignedRoom,
  createResourceScopeGuard,
};

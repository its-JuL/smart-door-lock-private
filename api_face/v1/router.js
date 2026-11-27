const router = require("express").Router();
const { loginRequired, allowedRole } = require("../../middlewares/authMiddlewares");
const { loadAccessScope } = require("../../middlewares/accessScopeMiddlewares");
const { requireAssignedDevice } = require("../../middlewares/scopeMiddlewares");
const { body } = require("express-validator");
const { formChacker } = require("../../middlewares/formMiddleware");
const controller = require("./controller_face");

const manager = [loginRequired, allowedRole("ADMIN", "OPERATOR"), loadAccessScope];

router.post(
  "/initiate-enrollment",
  ...manager,
  body("deviceId").notEmpty().isString(),
  body("targetUserId").notEmpty().isString(),
  formChacker,
  requireAssignedDevice,
  controller.initiateFaceEnrollment
);
router.get(
  "/latest-capture/:deviceId",
  ...manager,
  requireAssignedDevice,
  controller.getLatestCapture
);
module.exports = router;
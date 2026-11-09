const router = require("express").Router();
const { loginRequired, allowedRole } = require("../../middlewares/authMiddlewares");
const { loadAccessScope } = require("../../middlewares/accessScopeMiddlewares");
const {
  requireAssignedDevice,
  createResourceScopeGuard,
} = require("../../middlewares/scopeMiddlewares");
const prisma = require("../../prisma/client");
const { body, param, query } = require("express-validator");
const { formChacker } = require("../../middlewares/formMiddleware");
const controller = require("./controller_fingerprint");

const requireFingerprintScope = createResourceScopeGuard({
  resolveResource: (req) =>
    prisma.fingerprintMapping.findUnique({
      where: { id: req.params.id },
      select: { id: true, deviceId: true, roomId: true },
    }),
  isAllowed: (scope, mapping) => scope.deviceIds.includes(mapping.deviceId),
  title: "Fingerprint mapping is outside your assigned scope",
});

const manager = [loginRequired, allowedRole("ADMIN", "OPERATOR"), loadAccessScope];

router.post(
  "/sync-existing",
  ...manager,
  body("deviceId").notEmpty().isString(),
  body("targetUserId").notEmpty().isUUID(),
  body("fingerId").isInt({ min: 2, max: 127 }),
  formChacker,
  requireAssignedDevice,
  controller.syncExistingFingerprint
);
router.post(
  "/register",
  ...manager,
  body("deviceId").notEmpty().isString(),
  body("targetUserId").notEmpty().isUUID(),
  formChacker,
  requireAssignedDevice,
  controller.registerFingerprintMapping
);
router.post(
  "/initiate-enrollment",
  ...manager,
  body("deviceId").notEmpty().isString(),
  body("targetUserId").notEmpty().isUUID(),
  formChacker,
  requireAssignedDevice,
  controller.registerFingerprintMapping
);
router.get(
  "/list",
  ...manager,
  query("deviceId").optional().isString().withMessage("deviceId must be a string"),
  formChacker,
  controller.listFingerprints
);
router.get("/user/list", loginRequired, allowedRole("USER", "ADMIN", "OPERATOR"), controller.listUserFingerprints);
router.post(
  "/update/:id",
  ...manager,
  param("id").notEmpty(),
  body("isActive").optional().isBoolean(),
  formChacker,
  requireFingerprintScope,
  controller.updateFingerprintMapping
);
router.delete(
  "/delete/:id",
  ...manager,
  param("id").notEmpty(),
  requireFingerprintScope,
  controller.deleteFingerprintMapping
);
router.get(
  "/detail/:id",
  ...manager,
  param("id").notEmpty(),
  requireFingerprintScope,
  controller.getFingerprintDetail
);
router.get("/user/detail/:id", loginRequired, allowedRole("USER"), param("id").notEmpty(), controller.getUserFingerprintDetail);
module.exports = router;

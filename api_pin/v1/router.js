const router = require("express").Router();
const { loginRequired, allowedRole } = require("../../middlewares/authMiddlewares");
const { loadAccessScope } = require("../../middlewares/accessScopeMiddlewares");
const {
  requireAssignedDevice,
  createResourceScopeGuard,
} = require("../../middlewares/scopeMiddlewares");
const prisma = require("../../prisma/client");
const { body, param } = require("express-validator");
const { formChacker } = require("../../middlewares/formMiddleware");
const c = require("./controllers_pin");

const requirePinScope = createResourceScopeGuard({
  resolveResource: (req) =>
    prisma.pinCredential.findUnique({
      where: { id: req.params.pinId },
      select: { id: true, deviceId: true },
    }),
  isAllowed: (scope, pin) => scope.deviceIds.includes(pin.deviceId),
  title: "PIN credential is outside your assigned scope",
});

const manager = [loginRequired, allowedRole("ADMIN", "OPERATOR"), loadAccessScope];

router.get("/list", ...manager, c.listPins);
router.post(
  "/register",
  ...manager,
  body("pin").notEmpty().isNumeric().isLength({ min: 6, max: 6 }),
  body("deviceId").notEmpty().isString(),
  body("targetUserId").notEmpty().isUUID(),
  formChacker,
  requireAssignedDevice,
  c.registerPin
);
router.post(
  "/update/:pinId",
  ...manager,
  param("pinId").notEmpty(),
  body("newPin").notEmpty().isNumeric().isLength({ min: 6, max: 6 }),
  formChacker,
  requirePinScope,
  c.updatePin
);
router.delete("/delete/:pinId", ...manager, param("pinId").notEmpty(), requirePinScope, c.deletePin);
module.exports = router;

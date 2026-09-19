const router = require("express").Router();
const { loginRequired, allowedRole } = require("../../middlewares/authMiddlewares");
const { body, param } = require("express-validator");
const { formChacker } = require("../../middlewares/formMiddleware");
const { apiValidation } = require("../../middlewares/apiKeyMiddlewares");
const pinController = require("./controllers_pin");

router.get(
    "/list",
    loginRequired,
    allowedRole("USER", "ADMIN", "OPERATOR"),
    pinController.listUserPins
);
router.post(
    "/register",
    loginRequired,
    allowedRole("USER", "ADMIN", "OPERATOR"),
    body("pin").notEmpty().isNumeric().isLength({ min: 6, max: 6 }).withMessage("PIN must be 6 digits"),
    body("ruid").notEmpty().withMessage("Room RUID is required"),
    formChacker,
    pinController.registerPin
);
router.post(
    "/update/:pinId",
    loginRequired,
    allowedRole("USER", "ADMIN", "OPERATOR"),
    param("pinId").notEmpty(),
    body("newPin").notEmpty().isNumeric().isLength({ min: 6, max: 6 }),
    formChacker,
    pinController.updatePin
);
router.delete(
    "/delete/:pinId",
    loginRequired,
    allowedRole("USER", "ADMIN", "OPERATOR"),
    param("pinId").notEmpty(),
    pinController.deletePin
);
// router.post(
//     "/h/verify",
//     apiValidation,
//     body("pin").notEmpty().isNumeric().isLength({ min: 6, max: 6 }),
//     body("deviceId").notEmpty().withMessage("Device ID is required"),
//     formChacker,
//     pinController.verifyPinHardware
// );

module.exports = router;
const router = require("express").Router();
const { loginRequired, allowedRole } = require("../../middlewares/authMiddlewares");
const { body, param, query } = require("express-validator");
const { formChacker } = require("../../middlewares/formMiddleware");
const fingerprintController = require("./controller_fingerprint");

router.get(
    "/list",
    loginRequired,
    allowedRole("ADMIN", "OPERATOR"),
    query("deviceId").optional().isString().withMessage("deviceId must be a string"),
    formChacker,
    fingerprintController.listFingerprints
);
router.get(
    "/user/list",
    loginRequired,
    allowedRole("USER", "ADMIN", "OPERATOR"),
    fingerprintController.listUserFingerprints
);
// router.post(
//     "/register",
//     loginRequired,
//     allowedRole("ADMIN", "OPERATOR"),
//     body("deviceId").notEmpty().withMessage("Device ID is required"),
//     body("fingerId").notEmpty().isInt({ min: 1, max: 127 }).withMessage("Finger ID must be between 1-127"),
//     body("ruid").notEmpty().withMessage("Room RUID is required"),
//     body("userId").optional().isString().withMessage("User ID must be a string (default: current user)"),
//     formChacker,
//     fingerprintController.registerFingerprintMapping
// );
router.post(
    "/update/:id",
    loginRequired,
    allowedRole("ADMIN", "OPERATOR"),
    param("id").notEmpty().withMessage("Mapping ID is required"),
    body("isActive").optional().isBoolean().withMessage("isActive must be boolean"),
    formChacker,
    fingerprintController.updateFingerprintMapping
);
router.delete(
    "/delete/:id",
    loginRequired,
    allowedRole("ADMIN", "OPERATOR"),
    param("id").notEmpty().withMessage("Mapping ID is required"),
    fingerprintController.deleteFingerprintMapping
);
router.get(
    "/detail/:id",
    loginRequired,
    allowedRole("ADMIN", "OPERATOR"),
    param("id").notEmpty().withMessage("Mapping ID is required"),
    fingerprintController.getFingerprintDetail
);
router.get(
    "/user/detail/:id",
    loginRequired,
    allowedRole("USER"),
    param("id").notEmpty().withMessage("Mapping ID is required"),
    fingerprintController.getUserFingerprintDetail
);

module.exports = router;
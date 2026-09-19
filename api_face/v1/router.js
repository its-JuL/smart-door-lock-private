const router = require("express").Router();
const { loginRequired, allowedRole } = require("../../middlewares/authMiddlewares");
const { body } = require("express-validator");
const { formChacker } = require("../../middlewares/formMiddleware");
const controller = require("./controller_face");
router.post("/initiate-enrollment", loginRequired, allowedRole("ADMIN", "OPERATOR"), body("deviceId").notEmpty().isString(), body("targetUserId").notEmpty().isString(), formChacker, controller.initiateFaceEnrollment);
module.exports = router;

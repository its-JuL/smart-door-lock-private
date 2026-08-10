const express = require("express");
const router = express.Router();
const auth = require("./authControllers");
const {
    urlTokenIsValid,
    loginRequired,
} = require("../middlewares/authMiddlewares");
const { formChacker } = require("../middlewares/formMiddleware");
const { body, query } = require("express-validator");
const {
    logoutRequired,
    userEmailNotVerify,
} = require("../middlewares/uiMiddlewares");
router.get("/login", logoutRequired, auth.login);
router.get("/register", logoutRequired, auth.register);
router.get(
    "/need-email-verification",
    loginRequired,
    userEmailNotVerify,
    auth.needEmailVerification
);
router.get("/forget", logoutRequired, auth.forget);
router.get(
    "/reset-password",
    logoutRequired,
    query("token").notEmpty().withMessage("Can't find token from your url"),
    formChacker,
    urlTokenIsValid,
    auth.reset
);
module.exports = router;

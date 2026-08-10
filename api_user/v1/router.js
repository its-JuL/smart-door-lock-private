const express = require("express");
const router = express.Router();
const multer = require("multer");
const { body, query } = require("express-validator");
var storage = multer.diskStorage({
    destination: function (req, file, cb) {
        cb(null, "./public/storage/");
    },
    filename: function (req, file, cb) {
        const uniqueSuffix = Date.now() + "-" + Math.round(Math.random() * 1e9);
        let extArray = file.mimetype.split("/");
        let extension = extArray[extArray.length - 1];
        cb(
            null,
            `${file.fieldname}-${String(file.originalname)
                .split(".")[0]
                .replaceAll(" ", "-")}-${uniqueSuffix}.${extension}`
        );
    },
});
const upload = multer({
    storage: storage,
    limits: {
        fileSize: 2500000, // +- 2MB
    },
    fileFilter(req, file, cb) {
        if (!file.originalname.match(/\.(png|jpg|jpeg|PNG|JPG|JPEG)$/)) {
            // upload only png and jpg format
            return cb(new Error("Please upload a Image"));
        }
        cb(undefined, true);
    },
});
const user = require("./controllers_user");
const { formChacker } = require("../../middlewares/formMiddleware");
const {
    loginRequired,
    allowedRole,
    defaultRoleIsExist,
    userIsNotExist,
    emailIsNotExist,
    notCurrentUser,
    adminRoleIsExist,
    urlTokenIsValid,
    logoutRequired,
    emailIsExist,
    userEmailNotVerify,
} = require("../../middlewares/authMiddlewares");
const {
    cardIsExist,
    cardNotPair,
} = require("../../middlewares/cardMiddlewares");
const {
    userIsExist,
    usernameIsExist,
} = require("../../middlewares/userMiddlewares");

// USER ROUTER
router.get("/logout", user.logout);
router.get("/detail/:id", loginRequired, allowedRole("ADMIN"), user.detail);
router.get(
    "/autocomplete",
    loginRequired,
    allowedRole("ADMIN", "OPERATOR"),
    user.autocomplete
);
router.get("/list", loginRequired, allowedRole("ADMIN", "OPERATOR"), user.list);
router.post(
    "/register",
    body("username")
        .notEmpty()
        .isLength({ min: 3 })
        .withMessage("Username minimal 3 character")
        .not()
        .contains(" ")
        .withMessage("Username can't contain space"),
    body("email").isEmail().withMessage("Please enter valid email").trim(),
    body("password")
        .isStrongPassword()
        .withMessage(
            "Password must have at least 8 characters, have a combination of numbers, uppercase, lowercase letters and unique characters"
        ),
    formChacker,
    userIsNotExist,
    emailIsNotExist,
    user.register
);
router.post(
    "/login",
    body("username")
        .notEmpty()
        .isLength({ min: 3 })
        .withMessage("Username minimum have 3 character")
        .not()
        .contains(" ")
        .withMessage("Username can't contain space"),
    body("password").isLength({ min: "8" }),
    formChacker,
    defaultRoleIsExist,
    user.login
);
router.post(
    "/update/password",
    loginRequired,
    body("oldPassword").notEmpty(),
    body("newPassword")
        .isStrongPassword()
        .withMessage(
            "Password must have at least 8 characters, have a combination of numbers, uppercase, lowercase letters and unique characters"
        ),
    formChacker,
    user.updatePassword
);
router.post(
    "/admin/update/password",
    loginRequired,
    allowedRole("ADMIN"),
    body("uuid").notEmpty().withMessage("Please provide user id"),
    body("newPassword")
        .isStrongPassword()
        .withMessage(
            "Password must have at least 8 characters, have a combination of numbers, uppercase, lowercase letters and unique characters"
        ),
    formChacker,
    user.adminModifyUserPassword
);
router.post(
    "/update/profile",
    loginRequired,
    body("username")
        .notEmpty()
        .isLength({ min: 3 })
        .withMessage("Username minimal 3 character")
        .not()
        .contains(" ")
        .withMessage("Username can't contain space"),
    body("email").notEmpty().isEmail().withMessage("Email required"),
    body("full_name").notEmpty().withMessage("Full name required"),
    formChacker,
    user.profileUpdate
);
router.post(
    "/admin/update/profile",
    loginRequired,
    allowedRole("ADMIN"),
    body("uuid").notEmpty(),
    body("username")
        .notEmpty()
        .isLength({ min: 3 })
        .withMessage("Username minimal 3 character")
        .not()
        .contains(" ")
        .withMessage("Username can't contain space"),
    body("email").notEmpty().isEmail().withMessage("Email required"),
    body("full_name").notEmpty().withMessage("Full name required"),
    formChacker,
    user.adminModifyUserProfile
);
router.post(
    "/update/profile/picture",
    upload.single("avatar"),
    loginRequired,
    user.profileAvatarUpdate
);
router.post(
    "/admin/update/profile/picture",
    loginRequired,
    allowedRole("ADMIN"),
    upload.single("avatar"),
    user.adminModifyUserAvatar
);
router.delete(
    "/delete/:id",
    loginRequired,
    allowedRole("ADMIN"),
    userIsExist,
    notCurrentUser,
    user.delete
);
router.post(
    "/pair",
    loginRequired,
    allowedRole("ADMIN", "OPERATOR"),
    cardIsExist,
    usernameIsExist,
    cardNotPair,
    user.pairUserToCard
);
router.post(
    "/set-admin/:id",
    loginRequired,
    allowedRole("ADMIN"),
    userIsExist,
    adminRoleIsExist,
    notCurrentUser,
    user.setAdminRole
);

router.post(
    "/set-user/:id",
    loginRequired,
    allowedRole("ADMIN"),
    userIsExist,
    defaultRoleIsExist,
    notCurrentUser,
    user.setUserRole
);
router.post(
    "/send-verification-link/",
    loginRequired,
    userEmailNotVerify,
    user.sendVerificationEmail
);
router.get(
    "/email-verification-process/",
    query("token").notEmpty(),
    formChacker,
    urlTokenIsValid,
    user.verifyingEmail
);
router.post(
    "/forgot-password/",
    logoutRequired,
    body("email").notEmpty().isEmail(),
    formChacker,
    emailIsExist,
    user.forgotPassword
);
router.post(
    "/reset-password/",
    logoutRequired,
    query("token").notEmpty().withMessage("Can't find token from your url"),
    body("password")
        .isStrongPassword()
        .withMessage(
            "Password must have at least 8 characters, have a combination of numbers, uppercase, lowercase letters and unique characters"
        ),
    formChacker,
    urlTokenIsValid,
    user.resetPassword
);
module.exports = router;

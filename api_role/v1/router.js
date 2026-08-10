const router = require("express").Router();
const role = require("./controllers_role");
const {
    loginRequired,
    allowedRole,
    userIsExist,
} = require("../../middlewares/authMiddlewares");
const {
    roleIDIsExist,
    roleNameIsNotExist,
    roleNameIsExist,
} = require("../../middlewares/roleMiddlewares");
const { body } = require("express-validator");
const { formChacker } = require("../../middlewares/formMiddleware");

// ROLE ROUTER
router.get("/list", loginRequired, allowedRole("ADMIN"), role.list);
router.get(
    "/detail/:roleId",
    loginRequired,
    allowedRole("ADMIN"),
    roleIDIsExist,
    role.detail
);
router.post(
    "/create",
    loginRequired,
    allowedRole("ADMIN"),
    roleNameIsNotExist,
    role.create
);
router.post(
    "/delete/:roleId",
    loginRequired,
    allowedRole("ADMIN"),
    roleIDIsExist,
    role.delete
);
router.post(
    "/update/:roleId",
    loginRequired,
    allowedRole("ADMIN"),
    roleIDIsExist,
    roleNameIsNotExist,
    role.update
);
router.post(
    "/set-user-role",
    loginRequired,
    allowedRole("ADMIN"),
    body("username").notEmpty().withMessage("Username form requires"),
    body("rolename").notEmpty().withMessage("Role name form requires"),
    formChacker,
    roleNameIsExist,
    userIsExist,
    role.updateUserRole
);

module.exports = router;

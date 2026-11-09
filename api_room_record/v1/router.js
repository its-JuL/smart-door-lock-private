const router = require("express").Router();
const {
    loginRequired,
    allowedRole,
} = require("../../middlewares/authMiddlewares");
const { loadAccessScope } = require("../../middlewares/accessScopeMiddlewares");
const roomRecords = require("./controller");
router.get(
    "/logs",
    loginRequired,
    allowedRole("ADMIN", "OPERATOR"),
    loadAccessScope,
    roomRecords.logs
);
module.exports = router;

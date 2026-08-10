const router = require("express").Router();
const {
    loginRequired,
    allowedRole,
} = require("../../middlewares/authMiddlewares");
const roomRecords = require("./controller");
router.get("/logs", loginRequired, allowedRole("ADMIN"), roomRecords.logs);
module.exports = router;

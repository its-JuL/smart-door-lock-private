const express = require("express");
const router = express.Router();
const user = require("./userDashboardControllers");
const {
    loginRequired,
    allowedRole,
    accountIsVerified,
} = require("../middlewares/uiMiddlewares");

router.use(loginRequired, accountIsVerified); //memastikan user yang sudah aktif yang bisa menggunakan seluruh fitur
router.get("/", allowedRole("USER"), user.home);
router.get("/card/:id", allowedRole("USER"), user.cardLogs);
router.get("/card/change-pin/:id", allowedRole("USER"), user.cardChangePin);
router.get("/room/:card", allowedRole("USER"), user.cardRoom);

module.exports = router;

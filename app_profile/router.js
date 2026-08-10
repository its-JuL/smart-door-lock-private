const router = require("express").Router();
const controllers = require("./controller");
const {
    loginRequired,
    accountIsVerified,
} = require("../middlewares/uiMiddlewares");
router.get("/", loginRequired, accountIsVerified, controllers.profile);
module.exports = router;

const router = require("express").Router();
const api = require("./controllers_key");
const { body, query, param } = require("express-validator");
const {
    loginRequired,
    allowedRole,
} = require("../../middlewares/authMiddlewares");
const { formChacker } = require("../../middlewares/formMiddleware");
const { apiIDIsExist } = require("../../middlewares/apiKeyMiddlewares");

router.post(
    "/generate",
    loginRequired,
    allowedRole("ADMIN", "ADMIN TEKNIS"),
    api.createApiKey
);
router.get(
    "/list",
    loginRequired,
    allowedRole("ADMIN", "ADMIN TEKNIS"),
    api.apiKeyList
);
router.delete(
    "/delete/:id",
    loginRequired,
    allowedRole("ADMIN", "ADMIN TEKNIS"),
    param("id").notEmpty(),
    formChacker,
    apiIDIsExist,
    formChacker,
    api.delete
);

module.exports = router;

const { body } = require("express-validator");
const {
    loginRequired,
    allowedRole,
} = require("../../middlewares/authMiddlewares");
const { formChacker } = require("../../middlewares/formMiddleware");
const {
    gatewayShortIdIsExist,
    gatewayDeviceIsLinked,
    gatewayDeviceIsNotLinked,
} = require("../../middlewares/gatewayDeviceMiddlewares");
const gatewayDevice = require("./controller");
const { apiJWTValidation } = require("../../middlewares/apiKeyMiddlewares");
const { deviceIsExist } = require("../../middlewares/roomMiddlewares");
const router = require("express").Router();

router.post("/h/init", apiJWTValidation, gatewayDevice.createGatewayDevice); //HW
router.get(
    "/list",
    loginRequired,
    allowedRole("ADMIN", "ADMIN TEKNIS"),
    gatewayDevice.list
);
router.get(
    "/general-information",
    loginRequired,
    allowedRole("ADMIN", "ADMIN TEKNIS"),
    gatewayDevice.generalInformation
);
router.get(
    "/detail/:gatewayShortId",
    loginRequired,
    allowedRole("ADMIN", "ADMIN TEKNIS"),
    gatewayShortIdIsExist,
    gatewayDevice.detail
);
router.post(
    "/h/update-online-time/:gatewayShortId",
    apiJWTValidation,
    gatewayShortIdIsExist,
    gatewayDevice.updateOnline
); //HW
router.get(
    "/autocomplate",
    loginRequired,
    allowedRole("ADMIN", "ADMIN TEKNIS"),
    gatewayDevice.autocomplate
);
router.get(
    "/access-card-for-gateway/:gatewayShortId",
    loginRequired,
    allowedRole("ADMIN", "ADMIN TEKNIS"),
    gatewayShortIdIsExist,
    gatewayDevice.accessCardForGateway
);
router.get(
    "/h/access-card-for-gateway/:gatewayShortId",
    gatewayShortIdIsExist,
    gatewayDevice.accessCardForGateway
);
router.post(
    "/h/initialize-new-node",
    apiJWTValidation,
    body("gatewayShortId")
        .notEmpty()
        .withMessage("Gateway Short Id is Requried"),
    formChacker,
    gatewayShortIdIsExist,
    gatewayDeviceIsLinked,
    gatewayDevice.gatewayInitializeNode
); //HW
router.post(
    "/h/node-online-update",
    apiJWTValidation,
    body("duid").notEmpty().withMessage("Device Unique ID (DUID) is Requried"),
    formChacker,
    deviceIsExist,
    gatewayDevice.gatewayNodeOnlineUpdate
); //HW
router.post(
    "/h/register-card",
    apiJWTValidation,
    body("cardNumber").notEmpty().withMessage("Card Number is Requried"),
    formChacker,
    deviceIsExist,
    gatewayDevice.registerCard
); //HW
router.post(
    "/h/login",
    apiJWTValidation,
    body("username")
        .notEmpty()
        .isLength({ min: 3 })
        .withMessage("Username minimum have 3 character")
        .not()
        .contains(" ")
        .withMessage("Username can't contain space"),
    body("password").isLength({ min: "8" }),
    formChacker,
    gatewayDevice.login
); //HW
router.post(
    "/h/history",
    apiJWTValidation,
    body("cardNumber").notEmpty().withMessage("Card Number is Requried"),
    body("isSuccess")
        .notEmpty()
        .withMessage("Action status (isSuccess) is Requried"),
    body("duid").notEmpty().withMessage("Room Unique ID (ruid) is Requried"),
    formChacker,
    deviceIsExist,
    gatewayDevice.history
); //HW
router.post(
    "/h/history/bulk",
    apiJWTValidation,
    gatewayDevice.bulkCreateHistory
); //HW
router.delete(
    "/delete/",
    loginRequired,
    allowedRole("ADMIN", "ADMIN TEKNIS"),
    gatewayShortIdIsExist,
    gatewayDeviceIsNotLinked,
    gatewayDevice.deleteGateway
);

module.exports = router;

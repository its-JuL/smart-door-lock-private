const gatewaySpot = require("./controller");
const router = require("express").Router();
const {
    loginRequired,
    allowedRole,
} = require("../../middlewares/authMiddlewares");
const {
    gatewayShortIdIsExist,
    gatewayDeviceIsNotLinked,
} = require("../../middlewares/gatewayDeviceMiddlewares");
const { body } = require("express-validator");
const { formChacker } = require("../../middlewares/formMiddleware");
const {
    gatewaySpotIdIsExist,
    gatewaySpotNotHaveLinkingNode,
} = require("../../middlewares/gatewaySpotMiddlewares");
const {
    deviceIsExist,
    deviceTypeIsMultiNetwork,
    deviceNotLinkedToGatewayOtherSpot,
} = require("../../middlewares/roomMiddlewares");

router.post(
    "/link-to-device",
    loginRequired,
    allowedRole("ADMIN", "ADMIN TEKNIS"),
    body("name").notEmpty().withMessage("Name form is required"),
    body("gatewayShortId")
        .notEmpty()
        .withMessage("Gateway Short ID is required"),
    formChacker,
    gatewayShortIdIsExist,
    gatewayDeviceIsNotLinked,
    gatewaySpot.gatewaySpotLinktoGatewayDevice
);
router.get(
    "/detail/:id",
    loginRequired,
    allowedRole("ADMIN", "ADMIN TEKNIS"),
    gatewaySpotIdIsExist,
    gatewaySpot.detail
);
router.get(
    "/list/",
    loginRequired,
    allowedRole("ADMIN", "ADMIN TEKNIS"),
    gatewaySpot.list
);
router.delete(
    "/delete/",
    loginRequired,
    allowedRole("ADMIN", "ADMIN TEKNIS"),
    body("id").notEmpty().withMessage("ID is required"),
    formChacker,
    gatewaySpotIdIsExist,
    gatewaySpotNotHaveLinkingNode,
    gatewaySpot.delete
);
router.post(
    "/update/",
    loginRequired,
    allowedRole("ADMIN", "ADMIN TEKNIS"),
    body("id").notEmpty().withMessage("Gateway Spot ID is required"),
    body("name").notEmpty().withMessage("Name form is required"),
    body("gatewayShortId")
        .notEmpty()
        .withMessage("Gateway Short ID is required"),
    formChacker,
    gatewaySpotIdIsExist,
    gatewayShortIdIsExist,
    gatewayDeviceIsNotLinked,
    deviceIsExist,
    deviceTypeIsMultiNetwork,
    deviceNotLinkedToGatewayOtherSpot,
    gatewaySpot.update
);

router.get(
    "/general-information/",
    loginRequired,
    allowedRole("ADMIN", "ADMIN TEKNIS"),
    gatewaySpot.generalInformation
);

module.exports = router;

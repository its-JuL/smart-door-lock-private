const router = require("express").Router();
const room = require("./controllers");
const { apiValidation } = require("../../middlewares/apiKeyMiddlewares");
const { param, body, query } = require("express-validator");
const {
    cardIsExist,
    cardIsPair,
    isTwoStepAuth,
    isNewPinMatch,
    cardIsNotBanned,
} = require("../../middlewares/cardMiddlewares");
const {
    roomIsExist,
    cardIsHaveAccess,
    deviceIsExist,
    deviceNotPair,
    deviceIsPair,
    isDeviceTurePin,
    roomIsActive,
    roomAccessNotExist,
} = require("../../middlewares/roomMiddlewares");
const { formChacker } = require("../../middlewares/formMiddleware");
const {
    loginRequired,
    allowedRole,
} = require("../../middlewares/authMiddlewares");
const {
    requestIsExist,
} = require("../../middlewares/requestAccessMiddlewares");
const { buildingIsExist } = require("../../middlewares/buildingMiddlewares");

router.post(
    "/device/pair/",
    loginRequired,
    allowedRole("ADMIN", "ADMIN TEKNIS"),
    body("name").notEmpty().withMessage("Room Name required"),
    body("duid").notEmpty().withMessage("Device Form required"),
    body("buildingId").notEmpty().withMessage("Building Form Is Required"),
    formChacker,
    deviceIsExist,
    deviceNotPair,
    buildingIsExist,
    room.createRoom
);
router.get(
    "/device/list",
    loginRequired,
    allowedRole("ADMIN", "ADMIN TEKNIS"),
    room.deviceList
);
router.get(
    "/device/autocomplate",
    loginRequired,
    allowedRole("ADMIN", "ADMIN TEKNIS"),
    room.autocomplate
);
router.delete(
    "/device/delete/:duid",
    loginRequired,
    allowedRole("ADMIN", "ADMIN TEKNIS"),
    deviceIsExist,
    deviceNotPair,
    room.deviceDelete
);
router.post(
    "/device/change-pin/:duid",
    loginRequired,
    allowedRole("ADMIN", "ADMIN TEKNIS"),
    param("duid").notEmpty(),
    body("newPin").notEmpty().isNumeric().isLength({ min: "6", max: "6" }),
    body("confirmNewPin")
        .notEmpty()
        .isNumeric()
        .isLength({ min: "6", max: "6" }),
    body("oldPin").notEmpty().isNumeric().isLength({ min: "6", max: "6" }),
    formChacker,
    deviceIsExist,
    isNewPinMatch,
    isDeviceTurePin,
    room.changePin
);
router.post(
    "/pair",
    loginRequired,
    allowedRole("ADMIN", "ADMIN TEKNIS"),
    query("ruid").notEmpty(),
    query("cardNumber").notEmpty(),
    formChacker,
    cardIsExist,
    cardIsPair,
    roomIsExist,
    roomIsActive,
    requestIsExist,
    roomAccessNotExist,
    room.pairRoomToCard
);
router.post("/h/init", apiValidation, room.createDevice); //HW API
router.get("/h/detail/:duid", apiValidation, deviceIsExist, room.deviceDetail); //HW API
router.post("/h/online/:duid", apiValidation, deviceIsExist, room.onlineUpdate); //HW API
router.post(
    "/h/check-in/:duid",
    apiValidation,
    param("duid").notEmpty(),
    body("cardNumber").notEmpty(),
    formChacker,
    deviceIsExist,
    deviceIsPair,
    cardIsExist,
    cardIsPair,
    cardIsNotBanned,
    cardIsHaveAccess,
    isTwoStepAuth,
    room.roomCheckIn
); //HW ID
router.post(
    "/h/validate/:duid",
    apiValidation,
    body("pin").isLength({ min: "6", max: "6" }).notEmpty(),
    formChacker,
    deviceIsExist,
    deviceIsPair,
    room.validatePin
); // HW NEW API
module.exports = router;

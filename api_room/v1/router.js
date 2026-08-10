const router = require("express").Router();
const room = require("./controllers_room");
const { body, query, param } = require("express-validator");
const { formChacker } = require("../../middlewares/formMiddleware");
const {
    loginRequired,
    allowedRole,
    userIsExist,
} = require("../../middlewares/authMiddlewares");
const {
    cardIsExist,
    cardIsPair,
    isUserCard,
    isTwoStepAuth,
} = require("../../middlewares/cardMiddlewares");
const {
    roomIsExist,
    roomRequestNotExist,
    roomAccessNotExist,
    cardIsHaveAccess,
    roomIsActive,
    deviceIsExist,
    deviceNotPair,
    roomIsPair,
    roomAccessIsExist,
} = require("../../middlewares/roomMiddlewares");
const {
    requestIsExist,
    requestIdIsExist,
} = require("../../middlewares/requestAccessMiddlewares");
const { apiValidation } = require("../../middlewares/apiKeyMiddlewares");
const {
    onlyAccessibleByLinkedOperators,
    roomHasLinkedBuilding,
} = require("../../middlewares/buildingMiddlewares");

// ROOM ROUTER
router.get(
    "/list",
    loginRequired,
    allowedRole("ADMIN", "ADMIN TEKNIS", "OPERATOR"),
    room.list
);
router.get(
    "/autocomplate",
    loginRequired,
    allowedRole("ADMIN"),
    room.autocomplate
);
router.get(
    "/accaptable-user/:ruid",
    loginRequired,
    allowedRole("ADMIN", "ADMIN TEKNIS", "OPERATOR"),
    roomIsExist,
    roomHasLinkedBuilding,
    onlyAccessibleByLinkedOperators,
    room.accaptableUser
);
router.get(
    "/requestUser/:ruid",
    loginRequired,
    allowedRole("ADMIN", "ADMIN TEKNIS", "OPERATOR"),
    roomIsExist,
    roomHasLinkedBuilding,
    onlyAccessibleByLinkedOperators,
    room.requestRoomByUser
);
router.get("/u/list", loginRequired, allowedRole("USER"), room.activeRoomList);
router.get(
    "/u/accesable/:cardNumber",
    loginRequired,
    cardIsExist,
    allowedRole("USER"),
    room.userAccessableRoom
);
router.post(
    "/u/request",
    query("cardNumber").notEmpty(),
    query("ruid").notEmpty(),
    formChacker,
    loginRequired,
    allowedRole("USER"),
    cardIsExist,
    isUserCard,
    roomIsPair,
    roomIsActive,
    roomRequestNotExist,
    roomAccessNotExist,
    room.roomRequest
);
router.get(
    "/accesable/",
    loginRequired,
    allowedRole("ADMIN", "OPERATOR"),
    room.usernameAccessableRoom
);
router.get(
    "/detail/:ruid",
    loginRequired,
    allowedRole("ADMIN", "ADMIN TEKNIS", "OPERATOR"),
    roomIsExist,
    roomHasLinkedBuilding,
    onlyAccessibleByLinkedOperators,
    room.detail
);
router.delete(
    "/delete-room-request/",
    loginRequired,
    allowedRole("ADMIN", "OPERATOR"),
    query("requestId").notEmpty(),
    formChacker,
    requestIdIsExist,
    room.declineRoomRequest
);
router.post(
    "/update/:ruid",
    loginRequired,
    allowedRole("ADMIN", "ADMIN TEKNIS"),
    roomIsExist,
    deviceIsExist,
    deviceNotPair,
    room.update
);
router.delete(
    "/delete/:ruid",
    loginRequired,
    allowedRole("ADMIN", "ADMIN TEKNIS"),
    roomIsExist,
    room.delete
);
router.post(
    "/pair",
    loginRequired,
    allowedRole("ADMIN", "OPERATOR"),
    query("ruid").notEmpty(),
    query("cardNumber").notEmpty(),
    query("requestId").notEmpty(),
    formChacker,
    cardIsExist,
    cardIsPair,
    roomIsExist,
    roomIsActive,
    requestIsExist,
    roomAccessNotExist,
    onlyAccessibleByLinkedOperators,
    room.pairRoomToCard
);
router.post(
    "/unpair",
    loginRequired,
    allowedRole("ADMIN", "OPERATOR"),
    body("ruid").notEmpty(),
    body("cardNumber").notEmpty(),
    formChacker,
    cardIsExist,
    roomIsExist,
    roomAccessIsExist,
    onlyAccessibleByLinkedOperators,
    room.unPairRoomToCard
);
router.post(
    "/grantAllAccess/",
    loginRequired,
    allowedRole("ADMIN", "OPERATOR"),
    body("ruid").notEmpty(),
    formChacker,
    roomIsExist,
    room.grantAllAccess
);
router.post("/get-or-create", room.getOrCreateRoom); //HW API
router.get(
    "/logs/:ruid",
    loginRequired,
    allowedRole("ADMIN", "ADMIN TEKNIS", "OPERATOR"),
    roomIsExist,
    roomHasLinkedBuilding,
    onlyAccessibleByLinkedOperators,
    room.logs
);
router.post(
    "/validate/:ruid",
    body("pin").isLength({ min: "6", max: "6" }).notEmpty(),
    formChacker,
    roomIsExist,
    room.validatePin
); // HW OLD API
router.post(
    "/check-in/:ruid",
    param("ruid").notEmpty(),
    body("cardNumber").notEmpty(),
    formChacker,
    roomIsExist,
    cardIsExist,
    cardIsPair,
    cardIsHaveAccess,
    isTwoStepAuth,
    room.roomCheckIn
); //HW OLD API

module.exports = router;

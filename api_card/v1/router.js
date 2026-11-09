const router = require("express").Router();
const {
    loginRequired,
    allowedRole,
    userIsExist,
} = require("../../middlewares/authMiddlewares");
const { loadAccessScope } = require("../../middlewares/accessScopeMiddlewares");
const {
    requireAssignedDevice,
    createResourceScopeGuard,
} = require("../../middlewares/scopeMiddlewares");
const prisma = require("../../prisma/client");
const { canAccessCard } = require("../../services/operatorScope");
const {
    cardIsExist,
    isUserCard,
    isTurePin,
    isNewPinMatch,
    cardIsPair,
} = require("../../middlewares/cardMiddlewares");
const { body, param } = require("express-validator");
const { formChacker } = require("../../middlewares/formMiddleware");
const card = require("./controllers_card");
const { apiValidation } = require("../../middlewares/apiKeyMiddlewares");
const {
    roomIsExist,
    roomAccessNotExist,
} = require("../../middlewares/roomMiddlewares");

const requireCardScope = createResourceScopeGuard({
    resolveResource: (req) =>
        prisma.card.findUnique({
            where: { card_number: req.params.cardNumber || req.body.cardNumber },
            include: { room: { select: { id: true, ruid: true } } },
        }),
    isAllowed: (scope, targetCard) => canAccessCard(scope, targetCard),
    title: "Card is outside your assigned scope",
});

const manager = [loginRequired, allowedRole("ADMIN", "OPERATOR"), loadAccessScope];

// CARD ROUTER
router.post("/sync-existing", ...manager, body("deviceId").notEmpty().isString(), body("targetUserId").notEmpty().isUUID(), body("cardNumber").notEmpty().isString(), formChacker, requireAssignedDevice, card.syncExistingRfid);
router.post("/initiate-enrollment", ...manager, body("deviceId").notEmpty().isString(), body("targetUserId").notEmpty().isString(), formChacker, requireAssignedDevice, card.initiateCardEnrollment);
router.get("/u/available", loginRequired, allowedRole("USER"), card.userCards);
router.get(
    "/u/:cardNumber",
    loginRequired,
    allowedRole("USER"),
    cardIsExist,
    isUserCard,
    card.userCardsDetail
);
router.get(
    "/u/logs/:cardNumber",
    loginRequired,
    allowedRole("USER"),
    cardIsExist,
    isUserCard,
    card.userCardLogs
);
router.get(
    "/history/:username",
    loginRequired,
    allowedRole("ADMIN"),
    userIsExist,
    card.userCardHistory
);
router.get(
    "/available",
    ...manager,
    card.listOfUnRegisterCard // ! Will cause error in user ui
);
router.get(
    "/unavailable",
    ...manager,
    card.listOfRegisterCard // ! Will cause error in user ui
);
router.get(
    "/detail/:cardNumber",
    ...manager,
    cardIsExist,
    requireCardScope,
    card.detail
);
router.post(
    "/register",
    ...manager,
    body("cardNumber").notEmpty(),
    body("isTwoStepAuth").notEmpty(),
    body("pin").notEmpty().isLength(6),
    formChacker,
    card.cardRegistration
);
router.post(
    "/h/register",
    body("cardNumber").notEmpty(),
    body("pin").notEmpty().isLength(6),
    formChacker,
    apiValidation,
    card.cardRegistration
); // HW NEW API
router.post(
    "/update/:cardNumber",
    loginRequired,
    allowedRole("USER"),
    param("cardNumber").notEmpty(),
    body("cardName").notEmpty(),
    body("cardType").notEmpty(),
    body("isTwoStepAuth").notEmpty(),
    formChacker,
    cardIsExist,
    isUserCard,
    card.update
);
router.post(
    "/change-pin/:cardNumber",
    loginRequired,
    allowedRole("USER"),
    param("cardNumber").notEmpty(),
    body("newPin").notEmpty().isNumeric().isLength({ min: "6", max: "6" }),
    body("confirmNewPin")
        .notEmpty()
        .isNumeric()
        .isLength({ min: "6", max: "6" }),
    formChacker,
    cardIsExist,
    isUserCard,
    isNewPinMatch,
    isTurePin,
    card.changePin
);
router.post(
    "/change-auth-mode/:cardNumber",
    loginRequired,
    allowedRole("USER"),
    body("oldPin").notEmpty().isNumeric().isLength({ min: "6", max: "6" }),
    formChacker,
    cardIsExist,
    isUserCard,
    isTurePin,
    card.changeAuthType
);
router.delete(
    "/delete/:cardNumber",
    ...manager,
    cardIsExist,
    requireCardScope,
    card.delete
);
router.post(
    "/unpair",
    ...manager,
    body("cardNumber").notEmpty(),
    formChacker,
    cardIsExist,
    cardIsPair,
    requireCardScope,
    card.unpairUserToCard
);
router.get(
    "/autocomplate",
    ...manager,
    card.autocomplate
);
router.post(
    "/add-access-card-to-room",
    ...manager,
    body("ruid").notEmpty().withMessage("RUID is required"),
    body("cardNumber").notEmpty().withMessage("Card Number is required"),
    formChacker,
    cardIsExist,
    roomIsExist,
    roomAccessNotExist,
    card.addAccessCardToRoom
);
router.post(
    "/admin-modify-card/:cardNumber",
    ...manager,
    param("cardNumber").notEmpty(),
    body("cardName").notEmpty(),
    body("cardType").notEmpty(),
    body("isTwoStepAuth").notEmpty(),
    body("cardBannedStatus").notEmpty(),
    formChacker,
    cardIsExist,
    requireCardScope,
    card.adminModifyCard
);
router.post(
    "/admin-change-pin/:cardNumber",
    ...manager,
    param("cardNumber").notEmpty(),
    body("newPin").notEmpty().isNumeric().isLength({ min: "6", max: "6" }),
    body("confirmNewPin")
        .notEmpty()
        .isNumeric()
        .isLength({ min: "6", max: "6" }),
    formChacker,
    cardIsExist,
    isNewPinMatch,
    requireCardScope,
    card.adminModifyCardPin
);
router.get(
    "/logs/:cardNumber",
    ...manager,
    cardIsExist,
    requireCardScope,
    card.userCardLogs
);
module.exports = router;

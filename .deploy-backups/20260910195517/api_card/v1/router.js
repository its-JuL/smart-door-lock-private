const router = require("express").Router();
const {
    loginRequired,
    allowedRole,
    userIsExist,
} = require("../../middlewares/authMiddlewares");
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

// CARD ROUTER
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
    loginRequired,
    allowedRole("ADMIN", "OPERATOR"),
    card.listOfUnRegisterCard // ! Will cause error in user ui
);
router.get(
    "/unavailable",
    loginRequired,
    allowedRole("ADMIN", "OPERATOR"),
    card.listOfRegisterCard // ! Will cause error in user ui
);
router.get(
    "/detail/:cardNumber",
    loginRequired,
    allowedRole("ADMIN", "OPERATOR"),
    cardIsExist,
    card.detail
);
router.post(
    "/register",
    loginRequired,
    allowedRole("ADMIN", "OPERATOR"),
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
    loginRequired,
    allowedRole("ADMIN", "OPERATOR"),
    cardIsExist,
    card.delete
);
router.post(
    "/unpair",
    loginRequired,
    allowedRole("ADMIN", "OPERATOR"),
    body("cardNumber").notEmpty(),
    formChacker,
    cardIsExist,
    cardIsPair,
    card.unpairUserToCard
);
router.get(
    "/autocomplate",
    loginRequired,
    allowedRole("ADMIN", "OPERATOR"),
    card.autocomplate
);
router.post(
    "/add-access-card-to-room",
    loginRequired,
    allowedRole("ADMIN", "OPERATOR"),
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
    loginRequired,
    allowedRole("ADMIN", "OPERATOR"),
    param("cardNumber").notEmpty(),
    body("cardName").notEmpty(),
    body("cardType").notEmpty(),
    body("isTwoStepAuth").notEmpty(),
    body("cardBannedStatus").notEmpty(),
    formChacker,
    cardIsExist,
    card.adminModifyCard
);
router.post(
    "/admin-change-pin/:cardNumber",
    loginRequired,
    allowedRole("ADMIN", "OPERATOR"),
    param("cardNumber").notEmpty(),
    body("newPin").notEmpty().isNumeric().isLength({ min: "6", max: "6" }),
    body("confirmNewPin")
        .notEmpty()
        .isNumeric()
        .isLength({ min: "6", max: "6" }),
    formChacker,
    cardIsExist,
    isNewPinMatch,
    card.adminModifyCardPin
);
router.get(
    "/logs/:cardNumber",
    loginRequired,
    allowedRole("ADMIN", "OPERATOR"),
    cardIsExist,
    card.userCardLogs
);
module.exports = router;

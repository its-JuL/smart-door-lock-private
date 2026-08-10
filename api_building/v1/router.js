const router = require("express").Router();
const building = require("./controller");
const { body, param } = require("express-validator");
const { formChacker } = require("../../middlewares/formMiddleware");
const {
    allUsernamesExist,
    allUsernamesIsOperator,
    allRoomExist,
    allRoomNotLinkedToBuilding,
    buildingIsExist,
} = require("../../middlewares/buildingMiddlewares");
const {
    loginRequired,
    allowedRole,
} = require("../../middlewares/authMiddlewares");

router.get("/u/list/", loginRequired, allowedRole("USER"), building.list);
router.use(loginRequired, allowedRole("ADMIN"));
router.post(
    "/create/",
    body("name").notEmpty().withMessage("Please provide building name"),
    body("usernames")
        .isArray()
        .withMessage("Please provide a set of users to be the operator")
        .notEmpty()
        .withMessage("Please provide one or more user to be operator"),
    body("ruids").isArray().withMessage("Please provide an array of Room ID"),
    formChacker,
    allUsernamesExist,
    allUsernamesIsOperator,
    allRoomExist,
    allRoomNotLinkedToBuilding,
    building.create
);

router.post(
    "/update/",
    body("buildingId").notEmpty().withMessage("Please provide building ID"),
    body("name").notEmpty().withMessage("Please provide building name"),
    body("usernames")
        .isArray()
        .withMessage("Please provide a set of users to be the operator")
        .notEmpty()
        .withMessage("Please provide one or more user to be operator"),
    body("ruids").isArray().withMessage("Please provide an array of Room ID"),
    formChacker,
    buildingIsExist,
    allUsernamesExist,
    allUsernamesIsOperator,
    allRoomExist,
    allRoomNotLinkedToBuilding,
    building.update
);

router.delete(
    "/delete/",
    body("buildingId").notEmpty().withMessage("Please provide building ID"),
    formChacker,
    buildingIsExist,
    building.delete
);

router.get("/list/", building.list);
router.get("/general-information/", building.generalinformation);
router.get("/autocomplate/", building.autocomplate);
router.get(
    "/detail/:buildingId",
    param("buildingId").notEmpty(),
    formChacker,
    buildingIsExist,
    building.detail
);

module.exports = router;

const express = require("express");
const router = express.Router();
const dashboard = require("./dashboardControllers");
const userFeatures = require("../app_user/userDashboardControllers");
const {
    loginRequired,
    allowedRole,
    accountIsVerified,
} = require("../middlewares/uiMiddlewares");

router.get(
    "/",
    loginRequired,
    allowedRole("ADMIN", "ADMIN TEKNIS", "OPERATOR"),
    accountIsVerified,
    dashboard.dashboard
);
router.get(
    "/card/list",
    loginRequired,
    allowedRole("ADMIN", "OPERATOR"),
    accountIsVerified,
    dashboard.cardList
);
router.get(
    "/card/detail/:cardNumber",
    loginRequired,
    allowedRole("ADMIN", "OPERATOR"),
    accountIsVerified,
    dashboard.cardDetail
);
router.get(
    "/card/pair",
    loginRequired,
    allowedRole("ADMIN", "OPERATOR"),
    accountIsVerified,
    dashboard.userPairingToDashboard
);

router.get(
    "/card/admin-modify-pin/:id",
    loginRequired,
    allowedRole("ADMIN", "OPERATOR"),
    accountIsVerified,
    dashboard.adminModifyCardPin
);
router.get(
    "/card/scan",
    loginRequired,
    allowedRole("ADMIN", "OPERATOR"),
    accountIsVerified,
    dashboard.scanCard
);
router.get(
    "/pin/list",
    loginRequired,
    allowedRole("ADMIN", "OPERATOR"),
    accountIsVerified,
    dashboard.pinList
);
router.get(
    "/fingerprint/list",
    loginRequired,
    allowedRole("ADMIN", "OPERATOR"),
    accountIsVerified,
    dashboard.fingerprintList
);
router.get(
    "/face-recognition",
    loginRequired,
    allowedRole("ADMIN", "OPERATOR"),
    accountIsVerified,
    dashboard.faceRecognition
);
router.get(
    "/user/list",
    loginRequired,
    allowedRole("ADMIN", "OPERATOR"),
    accountIsVerified,
    dashboard.userList
);
router.get(
    "/user/edit/:username",
    loginRequired,
    allowedRole("ADMIN"),
    accountIsVerified,
    dashboard.userEdit
);
// ROOM
router.get(
    "/room/list",
    loginRequired,
    allowedRole("ADMIN", "ADMIN TEKNIS", "OPERATOR"),
    accountIsVerified,
    dashboard.roomList
);

router.get(
    "/room/create",
    loginRequired,
    allowedRole("ADMIN", "ADMIN TEKNIS"),
    accountIsVerified,
    dashboard.createroom
);

router.get(
    "/room/detail/:ruid",
    loginRequired,
    allowedRole("ADMIN", "ADMIN TEKNIS", "OPERATOR"),
    accountIsVerified,
    dashboard.roomDetail
);

router.get(
    "/room/edit/:ruid",
    loginRequired,
    allowedRole("ADMIN", "ADMIN TEKNIS"),
    accountIsVerified,
    dashboard.roomEdit
);

router.get(
    "/building/list",
    loginRequired,
    allowedRole("ADMIN"),
    accountIsVerified,
    dashboard.buildingList
);

router.get(
    "/building/create",
    loginRequired,
    allowedRole("ADMIN"),
    accountIsVerified,
    dashboard.buildingCreate
);

router.get(
    "/building/detail/:buildingId",
    loginRequired,
    allowedRole("ADMIN"),
    accountIsVerified,
    dashboard.buildingDetail
);

// API
router.get(
    "/api",
    loginRequired,
    allowedRole("ADMIN", "ADMIN TEKNIS"),
    accountIsVerified,
    dashboard.apiList
);

// HARDWARE
router.get(
    "/hardware",
    loginRequired,
    allowedRole("ADMIN", "ADMIN TEKNIS"),
    accountIsVerified,
    dashboard.hardware
);

// GATEWAY DEVICE LIST
router.get(
    "/gateway/device/list",
    loginRequired,
    allowedRole("ADMIN", "ADMIN TEKNIS"),
    dashboard.gatewayDeviceList
);

router.get(
    "/gateway/spot/list",
    loginRequired,
    allowedRole("ADMIN", "ADMIN TEKNIS"),
    dashboard.gatewaySpotList
);
router.get(
    "/gateway/spot/link-to-device",
    loginRequired,
    allowedRole("ADMIN", "ADMIN TEKNIS"),
    dashboard.gatewaySpotLinkToDevice
);
router.get(
    "/gateway/spot/detail/:id",
    loginRequired,
    allowedRole("ADMIN", "ADMIN TEKNIS"),
    dashboard.gatewaySpotDetail
);

module.exports = router;

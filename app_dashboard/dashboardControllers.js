const prisma = require("../prisma/client");
const { layoutHandler } = require("../services/layout");
const { getUser } = require("../services/auth");
const ITEM_LIMIT = Number(process.env.CARD_ITEM_LIMIT) || 10;
// const ITEM_LIMIT = 5;

exports.dashboard = async (req, res) => {
    const unRegisterCard = await prisma.card.count({
        where: { card_status: "UNREGISTER" },
    });
    const registerCard = await prisma.card.count({
        where: { card_status: "REGISTER" },
    });
    const userCount = await prisma.user.count();
    const roomCount = await prisma.room.count();
    const roomRecord = await prisma.rooms_Records.count();
    const userUnPair = await prisma.user.findMany({
        include: {
            card: true,
        },
    });
    const userUnPairCount = userUnPair.filter((value) => {
        if (value.card.length === 0) return value;
    }).length;

    const data = {
        dashboard: "bg-neutral-4",
        styles: [],
        scripts: ["/js/dashboard.js"],
        unRegisterCard,
        registerCard,
        userCount,
        userUnPairCount,
        roomCount,
        roomRecord: roomRecord < 9999 ? roomRecord : "9999+",
        layout: await layoutHandler(getUser(req)),
    };

    res.render("index", data);
};

exports.userPairingToDashboard = async (req, res) => {
    const cardId = req.query.cardId;

    const options = {
        weekday: "long",
        year: "numeric",
        month: "long",
        day: "numeric",
    };

    const data = {
        card: "bg-neutral-4",
        styles: [
            "/style/pairUser.css",
            "https://code.jquery.com/ui/1.13.1/themes/base/jquery-ui.css",
        ],
        scripts: [
            "https://code.jquery.com/jquery-3.6.0.js",
            "https://code.jquery.com/ui/1.13.1/jquery-ui.js",
            "/js/pairUser.js",
        ],
        cardId,
        layout: await layoutHandler(getUser(req)),
    };
    res.render("pair", data);
};

exports.cardList = async (req, res) => {
    const cardList = await prisma.card.findMany({
        where: { card_status: "UNREGISTER" },
        orderBy: {
            createdAt: "asc",
        },
        take: ITEM_LIMIT,
    });
    const data = {
        card: "bg-neutral-4",
        styles: ["/style/cardList.css"],
        scripts: ["/js/cardList.js"],
        cardList,
        helpers: {
            days(value, options) {
                return `${Intl.DateTimeFormat("id", {
                    year: "numeric",
                    month: "long",
                    day: "numeric",
                    hour: "numeric",
                    minute: "numeric",
                }).format(new Date(value))} WIB`;
            },
        },
        layout: await layoutHandler(getUser(req)),
    };

    res.render("cardList", data);
};

exports.cardDetail = async (req, res) => {
    try {
        const { cardNumber } = req.params;
        const data = {
            card: "bg-neutral-4",
            styles: [
                "/style/api.css",
                "/style/buildingList.css",
                "/style/cardDetail.css",
            ],
            scripts: [
                "/js/cardDetails.js",
                "/js/cardDetailsHistory.js",
                "/js/cardDetailsEditAccessable.js",
            ],
            id: cardNumber,
        };

        res.render("cardDetails", data);
    } catch (error) {}
};

/** Fungsi Untuk Memodifikasi pin kartu milik user */
exports.adminModifyCardPin = (req, res) => {
    const { id } = req.params;
    const data = {
        card: "bg-neutral-4",
        styles: ["/style/changePin.css"],
        scripts: ["/js/cardChangePin.js"],
        id,
    };
    res.render("cardChangePin", data);
};

exports.userList = async (req, res) => {
    const userData = await prisma.user.findUnique({
        where: { id: getUser(req) },
        include: { role: true },
    });
    const data = {
        users: "bg-neutral-4",
        styles: ["/style/userList.css"],
        scripts: ["/js/userList.js"],
        adminRole: userData.role.name,
        layout: await layoutHandler(getUser(req)),
    };

    res.render("userList", data);
};

exports.userEdit = async (req, res) => {
    const { username } = req.params;
    try {
        const userData = await prisma.user.findUnique({
            where: { username },
            select: {
                profil: {
                    select: {
                        photo: true,
                        full_name: true,
                    },
                },
                username: true,
                email: true,
                emailIsVerified: true,
                id: true,
            },
        });

        const data = {
            users: "bg-neutral-4",
            styles: ["/style/profil.css", "/style/userEdit.css"],
            scripts: [
                "/js/userEdit.js",
                "/js/userEditHistory.js",
                "/js/userEditAccessable.js",
            ],
            user_active: "bg-neutral-4",
            avatar: userData.profil.photo || "/image/illustration-user.png",
            userData,
        };
        res.render("userEdit", data);
    } catch (error) {
        data = {
            errors: error,
        };
        res.render("erros", data);
    }
};

exports.createroom = async (req, res) => {
    const hardwareList = await prisma.device.findMany({
        orderBy: { createdAt: "asc" },
        take: ITEM_LIMIT,
        where: {
            roomId: null,
        },
    });
    const data = {
        room: "bg-neutral-4",
        styles: [
            "/style/pairUser.css",
            "/style/api.css",
            "/style/createroom.css",
            "https://code.jquery.com/ui/1.13.1/themes/base/jquery-ui.css",
        ],
        scripts: [
            "https://code.jquery.com/jquery-3.6.0.js",
            "https://code.jquery.com/ui/1.13.1/jquery-ui.js",
            "/js/createroom.js",
        ],
        hardwareList,
        helpers: {
            inc(value, options) {
                return parseInt(value) + 1;
            },
            days(value, options) {
                return `${Intl.DateTimeFormat("id", {
                    year: "numeric",
                    month: "long",
                    day: "numeric",
                    hour: "numeric",
                    minute: "numeric",
                }).format(new Date(value))} WIB`;
            },
        },
        layout: await layoutHandler(getUser(req)),
    };

    res.render("roomCreate", data);
};

exports.roomList = async (req, res) => {
    const userData = await prisma.user.findUnique({
        where: { id: getUser(req) },
        include: { role: true },
    });
    const data = {
        room: "bg-neutral-4",
        styles: ["/style/userList.css"],
        scripts: ["/js/roomList.js"],
        isSuperAdmin: userData.role.name === "ADMIN" ? true : false,
        adminRole: userData.role.name,
        layout: await layoutHandler(getUser(req)),
    };

    res.render("roomList", data);
};

exports.roomDetail = async (req, res) => {
    const { ruid } = req.params;
    const data = {
        room: "bg-neutral-4",
        styles: [
            "/style/pairUser.css",
            "https://code.jquery.com/ui/1.13.1/themes/base/jquery-ui.css",
            "/style/roomDetail.css",
        ],
        scripts: [
            "https://code.jquery.com/jquery-3.6.0.js",
            "https://code.jquery.com/ui/1.13.1/jquery-ui.js",
            "/js/roomDetail.js",
            "/js/roomDetailAccaptableCard.js",
            "/js/roomDetailAccaptableRequestUser.js",
            "/js/roomDetailHistory.js",
        ],
        ruid,
        layout: await layoutHandler(getUser(req)),
    };

    res.render("roomDetail", data);
};

exports.roomEdit = async (req, res) => {
    const { ruid } = req.params;
    const roomDetail = await prisma.room.findUnique({
        where: { ruid },
        include: {
            device: true,
            Building: { select: { name: true, id: true } },
        },
    });
    const hardwareList = await prisma.device.findMany({
        orderBy: { createdAt: "asc" },
        take: ITEM_LIMIT,
        where: {
            roomId: null,
        },
    });
    const data = {
        room: "bg-neutral-4",
        styles: [
            "/style/pairUser.css",
            "https://code.jquery.com/ui/1.13.1/themes/base/jquery-ui.css",
            "/style/api.css",
            "/style/createroom.css",
            "/style/roomEdit.css",
        ],
        scripts: [
            "https://code.jquery.com/jquery-3.6.0.js",
            "https://code.jquery.com/ui/1.13.1/jquery-ui.js",
            "/js/roomupdate.js",
        ],
        hardwareList,
        ruid,
        roomDetail,
        helpers: {
            inc(value, options) {
                return parseInt(value) + 1;
            },
            days(value, options) {
                return `${Intl.DateTimeFormat("id", {
                    year: "numeric",
                    month: "long",
                    day: "numeric",
                    hour: "numeric",
                    minute: "numeric",
                }).format(new Date(value))} WIB`;
            },
        },
        layout: await layoutHandler(getUser(req)),
    };

    res.render("roomEdit", data);
};

exports.apiList = async (req, res) => {
    const apiListData = await prisma.api_Key.findMany({
        select: { id: true, secret: true, createdAt: true },
        orderBy: { createdAt: "asc" },
        take: ITEM_LIMIT,
    });
    const data = {
        api: "bg-neutral-4",
        styles: ["/style/api.css"],
        scripts: ["/js/api.js"],
        apiListData,
        helpers: {
            inc(value, options) {
                return parseInt(value) + 1;
            },
        },
        layout: await layoutHandler(getUser(req)),
    };
    res.render("api", data);
};

exports.hardware = async (req, res) => {
    const hardwareList = await prisma.device.findMany({
        orderBy: { createdAt: "asc" },
        take: ITEM_LIMIT,
    });
    const data = {
        hardware: "bg-neutral-4",
        styles: ["/style/api.css", "/style/hardware.css"],
        scripts: ["/js/hardware.js"],
        hardwareList,
        helpers: {
            inc(value, options) {
                return parseInt(value) + 1;
            },
            days(value, options) {
                return `${Intl.DateTimeFormat("id", {
                    year: "numeric",
                    month: "long",
                    day: "numeric",
                    hour: "numeric",
                    minute: "numeric",
                }).format(new Date(value))} WIB`;
            },
        },
        layout: await layoutHandler(getUser(req)),
    };
    res.render("hardware", data);
};

exports.scanCard = async (req, res) => {
    const data = {
        card: "bg-neutral-4",
        styles: ["/style/userCardLogs.css"],
        scripts: ["/js/cardScan.js"],
    };
    res.render("scanCard", data);
};

const authenticationPage = async (req, res, view, active) => {
    res.render(view, {
        [active]: "bg-neutral-4",
        authentication: "bg-neutral-4",
        styles: ["/style/credentials.css"],
        scripts: ["/js/credentials.js"],
        layout: await layoutHandler(getUser(req)),
    });
};

exports.pinList = async (req, res) => authenticationPage(req, res, "pinList", "pin");
exports.fingerprintList = async (req, res) => authenticationPage(req, res, "fingerprintList", "fingerprint");
exports.faceRecognition = async (req, res) => authenticationPage(req, res, "faceRecognition", "faceRecognition");

exports.buildingList = async (req, res) => {
    const data = {
        building: "bg-neutral-4",
        styles: ["/style/api.css", "/style/buildingList.css"],
        scripts: ["/js/buildingList.js"],
    };
    res.render("buildingList", data);
};

exports.buildingCreate = async (req, res) => {
    const data = {
        building: "bg-neutral-4",
        styles: [
            "/style/pairUser.css",
            "/style/api.css",
            "/style/buildingList.css",
            "/style/buildingCreate.css",
            "https://code.jquery.com/ui/1.13.1/themes/base/jquery-ui.css",
        ],
        scripts: [
            "https://code.jquery.com/jquery-3.6.0.js",
            "https://code.jquery.com/ui/1.13.1/jquery-ui.js",
            "/js/buildingCreate.js",
        ],
    };
    res.render("buildingCreate", data);
};

exports.buildingDetail = async (req, res) => {
    const data = {
        building: "bg-neutral-4",
        styles: [
            "/style/pairUser.css",
            "/style/api.css",
            "/style/buildingList.css",
            "/style/buildingCreate.css",
            "https://code.jquery.com/ui/1.13.1/themes/base/jquery-ui.css",
        ],
        scripts: [
            "https://code.jquery.com/jquery-3.6.0.js",
            "https://code.jquery.com/ui/1.13.1/jquery-ui.js",
            "/js/buildingDetail.js",
        ],
    };
    res.render("buildingDetail", data);
};

exports.gatewayDeviceList = async (req, res) => {
    const data = {
        gatewayDevice: "bg-neutral-4",
        styles: ["/style/api.css", "/style/buildingList.css"],
        scripts: ["/js/gatewayDeviceList.js"],
    };
    res.render("gatewayDeviceList.handlebars", data);
};

exports.gatewaySpotList = async (req, res) => {
    const data = {
        gatewaySpot: "bg-neutral-4",
        styles: ["/style/api.css", "/style/buildingList.css"],
        scripts: ["/js/gatewaySpotList.js"],
    };
    res.render("gatewaySpotList.handlebars", data);
};

exports.gatewaySpotLinkToDevice = async (req, res) => {
    const data = {
        gatewaySpot: "bg-neutral-4",
        styles: [
            "/style/pairUser.css",
            "/style/api.css",
            "/style/buildingList.css",
            "/style/buildingCreate.css",
            "https://code.jquery.com/ui/1.13.1/themes/base/jquery-ui.css",
        ],
        scripts: [
            "https://code.jquery.com/jquery-3.6.0.js",
            "https://code.jquery.com/ui/1.13.1/jquery-ui.js",
            "/js/gatewaySpotLinking.js",
        ],
    };
    res.render("gatewaySpotLinking", data);
};

exports.gatewaySpotDetail = async (req, res) => {
    const { id } = req.params;
    const data = {
        gatewaySpot: "bg-neutral-4",
        styles: [
            "/style/pairUser.css",
            "/style/api.css",
            "/style/buildingList.css",
            "/style/buildingCreate.css",
            "https://code.jquery.com/ui/1.13.1/themes/base/jquery-ui.css",
        ],
        scripts: [
            "https://code.jquery.com/jquery-3.6.0.js",
            "https://code.jquery.com/ui/1.13.1/jquery-ui.js",
            "/js/gatewaySpotDetail.js",
        ],
        id,
    };
    res.render("gatewaySpotEdit", data);
};

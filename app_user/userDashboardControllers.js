const prisma = require("../prisma/client");
const { getUser } = require("../services/auth");
const {
    buildCredentialSummary,
    buildAccessHistory,
} = require("../services/credentialSummary");

module.exports.home = (req, res) => {
    const data = {
        layout: "userBase",
        card: "bg-neutral-4",
        styles: ["/style/userCardList.css"],
        scripts: ["/js/user/cardList.js"],
    };
    res.render("user/user", data);
};

module.exports.cardLogs = async (req, res) => {
    const { id } = req.params;
    const data = {
        layout: "userBase",
        card: "bg-neutral-4",
        styles: ["/style/userCardLogs.css"],
        scripts: ["/js/user/cardLogs.js"],
        id,
    };
    res.render("user/userCardLogs", data);
};

module.exports.cardChangePin = (req, res) => {
    const { id } = req.params;
    const data = {
        layout: "userBase",
        card: "bg-neutral-4",
        styles: ["/style/changePin.css"],
        scripts: ["/js/user/cardChangePin.js"],
        id,
    };
    res.render("user/userChangePin", data);
};

module.exports.cardRoom = (req, res) => {
    const { card: id } = req.params;
    const data = {
        layout: "userBase",
        card: "bg-neutral-4",
        styles: [
            "/style/userCardLogs.css",
            "/style/buildingList.css",
            "/style/api.css",
            "/style/userCardRoom.css",
        ],
        scripts: ["/js/user/cardRoomScrolhandler.js", "/js/user/cardRoom.js"],
        id,
    };
    res.render("user/userCardRoom", data);
};

/**
 * Halaman "Autentikasi Saya" untuk USER (read-only).
 * User melihat metode autentikasi apa saja yang sudah terdaftar untuk dirinya
 * (kartu, PIN, sidik jari, wajah) beserta hasil permintaan akses terakhir dari
 * metode apa pun, tanpa bisa mengubah data.
 */
module.exports.authentication = async (req, res) => {
    const userId = getUser(req);
    let summary = buildCredentialSummary();
    let history = [];

    try {
        const [cards, pins, fingerprints, faces, records] = await Promise.all([
            prisma.card.findMany({
                where: { userId },
                orderBy: { createdAt: "asc" },
                select: {
                    card_number: true,
                    card_name: true,
                    card_status: true,
                    banned: true,
                    createdAt: true,
                    room: { select: { ruid: true, name: true } },
                },
            }),
            prisma.pinCredential.findMany({
                where: { userId },
                orderBy: { createdAt: "desc" },
                select: {
                    deviceId: true,
                    isActive: true,
                    createdAt: true,
                },
            }),
            prisma.fingerprintMapping.findMany({
                where: { userId },
                orderBy: { createdAt: "desc" },
                select: {
                    deviceId: true,
                    fingerId: true,
                    isActive: true,
                    createdAt: true,
                    room: { select: { ruid: true, name: true } },
                },
            }),
            prisma.faceRecognition.findMany({
                where: { userId },
                orderBy: { createdAt: "desc" },
                select: {
                    isActive: true,
                    createdAt: true,
                    room: { select: { ruid: true, name: true } },
                },
            }),
            prisma.rooms_Records.findMany({
                where: { userId },
                orderBy: { createdAt: "desc" },
                take: 20,
                select: {
                    authenticationMethod: true,
                    isSuccess: true,
                    createdAt: true,
                    unregisteredCard: true,
                    room: { select: { ruid: true, name: true } },
                    Card: { select: { card_name: true, card_number: true } },
                },
            }),
        ]);

        const devices = await prisma.device.findMany({
            where: { device_id: { in: [...new Set(pins.map((pin) => pin.deviceId))] } },
            select: { device_id: true, room: { select: { ruid: true, name: true } } },
        });
        const roomByDevice = new Map(
            devices.map((device) => [device.device_id, device.room])
        );

        summary = buildCredentialSummary({
            cards,
            pins: pins.map((pin) => ({
                ...pin,
                room: roomByDevice.get(pin.deviceId) || null,
            })),
            fingerprints,
            faces,
        });
        history = buildAccessHistory(records);
    } catch (error) {
        console.log(error);
    }

    const data = {
        layout: "userBase",
        authentication: "bg-neutral-4",
        styles: ["/style/buildingList.css", "/style/userCardLogs.css"],
        summary,
        history,
        hasHistory: history.length > 0,
    };
    res.render("user/userAuthentication", data);
};

/**
 * Halaman Room untuk USER: menampilkan seluruh ruangan yang dapat diakses
 * dari semua kartu milik user, serta ruangan aktif yang masih bisa diminta.
 */
module.exports.roomList = async (req, res) => {
    const userId = getUser(req);
    let cards = [];
    let accessible = [];
    let available = [];
    try {
        cards = await prisma.card.findMany({
            where: { userId },
            orderBy: { createdAt: "asc" },
            select: { id: true, card_number: true, card_name: true },
        });

        const cardIds = cards.map((card) => card.id);

        const accessibleRooms = cardIds.length
            ? await prisma.room.findMany({
                  where: {
                      isActive: true,
                      card: { some: { id: { in: cardIds } } },
                  },
                  orderBy: { name: "asc" },
                  select: {
                      id: true,
                      ruid: true,
                      name: true,
                      Building: { select: { name: true } },
                      card: {
                          where: { id: { in: cardIds } },
                          select: { card_name: true, card_number: true },
                      },
                  },
              })
            : [];

        const pendingRequests = cardIds.length
            ? await prisma.room_Request.findMany({
                  where: { cardId: { in: cardIds } },
                  select: { roomId: true, cardId: true },
              })
            : [];
        const pendingKeys = new Set(
            pendingRequests.map((request) => `${request.roomId}:${request.cardId}`)
        );

        accessible = accessibleRooms.map((room, index) => ({
            no: index + 1,
            ruid: room.ruid,
            name: room.name || "-",
            building: room.Building ? room.Building.name : "-",
            cards:
                room.card
                    .map((card) => card.card_name || card.card_number)
                    .join(", ") || "-",
        }));

        const availableRooms = await prisma.room.findMany({
            where: {
                isActive: true,
                device: { isNot: null },
                id: { notIn: accessibleRooms.map((room) => room.id) },
            },
            orderBy: { name: "asc" },
            take: 50,
            select: {
                id: true,
                ruid: true,
                name: true,
                Building: { select: { name: true } },
            },
        });

        available = availableRooms.map((room, index) => ({
            no: index + 1,
            ruid: room.ruid,
            name: room.name || "-",
            building: room.Building ? room.Building.name : "-",
            pending: cards.length
                ? cards.every((card) => pendingKeys.has(`${room.id}:${card.id}`))
                : false,
        }));
    } catch (error) {
        console.log(error);
    }

    const data = {
        layout: "userBase",
        room: "bg-neutral-4",
        styles: ["/style/buildingList.css", "/style/userCardRoom.css"],
        scripts: ["/js/user/roomList.js"],
        cards: cards.map((card) => ({
            card_number: card.card_number,
            card_name: card.card_name || card.card_number,
        })),
        hasCard: cards.length > 0,
        accessible,
        available,
    };
    res.render("user/userRoomList", data);
};

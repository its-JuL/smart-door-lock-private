const prisma = require("../prisma/client");
const { getUser } = require("../services/auth");

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

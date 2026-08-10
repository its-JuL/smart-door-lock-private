const { resError, resSuccess } = require("../services/responseHandler");
const prisma = require("../prisma/client");

const requestIsExist = async (req, res, next) => {
    const id =
        req.body.requestId || req.params.requestId || req.query.requestId;
    const { ruid, cardNumber } = req.query;

    try {
        const roomRequest = await prisma.room_Request.findUnique({
            where: { id },
            include: {
                room: true,
                card: true,
            },
        });
        if (!roomRequest) throw "Cant find room request";
        if (
            roomRequest.room.ruid !== ruid ||
            roomRequest.card.card_number !== cardNumber
        )
            throw "Room request not match";
        return next();
    } catch (error) {
        return resError({
            res,
            title: error,
        });
    }
};

const requestIdIsExist = async (req, res, next) => {
    const id =
        req.body.requestId || req.params.requestId || req.query.requestId;

    try {
        const roomRequest = await prisma.room_Request.findUnique({
            where: { id },
            include: {
                room: true,
                card: true,
            },
        });

        if (!roomRequest) throw "Cant find room request";
        return next();
    } catch (error) {
        return resError({
            res,
            title: error,
        });
    }
};

module.exports = { requestIsExist, requestIdIsExist };

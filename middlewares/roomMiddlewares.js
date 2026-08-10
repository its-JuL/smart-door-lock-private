const prisma = require("../prisma/client");
const { hashChecker } = require("../services/auth");
const { resError, ErrorException } = require("../services/responseHandler");

const roomIsExist = async (req, res, next) => {
    const ruid = req.params.ruid || req.body.ruid || req.query.ruid;
    try {
        if (ruid) {
            const room = await prisma.room.findUnique({
                where: {
                    ruid,
                },
            });
            if (!room) throw "Can't find the room by the room id";
            if (room) return next();
        }
    } catch (error) {
        return resError({
            res,
            title: error,
            errors: error,
        });
    }
};

const roomIsPair = async (req, res, next) => {
    try {
        const ruid = req.params.ruid || req.body.ruid || req.query.ruid;
        const room = await prisma.room.findUnique({
            where: {
                ruid,
            },
            include: { device: true },
        });
        if (!room?.device) throw "Room is not pair yet";
        if (room?.device) return next();
    } catch (error) {
        return resError({
            res,
            title: error,
            errors: error,
        });
    }
};

const deviceIsPair = async (req, res, next) => {
    try {
        const duid = req.params.duid || req.body.duid || req.query.duid;
        const device = await prisma.device.findUnique({
            where: {
                device_id: duid,
            },
            include: { room: true },
        });
        if (!device?.room) throw "Device is not pair yet";
        if (device?.room) return next();
    } catch (error) {
        return resError({
            res,
            title: error,
            errors: error,
        });
    }
};

const deviceIsExist = async (req, res, next) => {
    const duid = req.params.duid || req.body.duid || req.query.duid;
    try {
        if (typeof duid === "string") {
            const device = await prisma.device.findUnique({
                where: {
                    device_id: duid,
                },
            });

            if (!device) throw "Can't find the device";
        }

        if (typeof duid === "object") {
            const unfilterDuid =
                req.params.duid || req.body.duid || req.query.duid;
            const duid = [...new Set(unfilterDuid)];
            const devices = await prisma.device.findMany({
                where: {
                    device_id: { in: duid },
                },
            });
            if (devices.length !== duid.length) throw "Can't find the device";
        }

        return next();
    } catch (error) {
        return resError({
            res,
            title: "Device is not exist",
            errors: error,
        });
    }
};

/** Fungsi untuk memastikan semua tipe node/perangkat yang tertaut dengan gateway spot bertipe multi network */
const deviceTypeIsMultiNetwork = async (req, res, next) => {
    try {
        const unfilterDuid = req.params.duid || req.body.duid || req.query.duid;
        if (typeof unfilterDuid === "object") {
            const duid = [...new Set(unfilterDuid)];
            const devices = await prisma.device.findMany({
                where: {
                    device_id: { in: duid },
                    deviceType: "MULTI_NETWORK",
                },
            });
            if (devices.length !== duid.length)
                throw "Device type not multi network";
        }
        return next();
    } catch (error) {
        return resError({
            res,
            title: "Device type not multi network",
            errors: error,
        });
    }
};

/** Fungsi untuk memastikan seluruh node yang akan ditautkan kepada gateway spot tidak terikat ke gateway spot lainnya atau belum tertaut sama sekali */
const deviceNotLinkedToGatewayOtherSpot = async (req, res, next) => {
    try {
        const unfilterDuid = req.params.duid || req.body.duid || req.query.duid;

        const id = req.params.id || req.body.id || req.query.id;
        if (typeof unfilterDuid === "object") {
            const duid = [...new Set(unfilterDuid)];
            const devices = await prisma.device.findMany({
                where: {
                    device_id: { in: duid },
                    deviceType: "MULTI_NETWORK",
                },
                select: {
                    gateway_SpotId: true,
                },
            });
            devices.forEach((device) => {
                if (
                    device.gateway_SpotId !== null &&
                    device.gateway_SpotId !== id
                ) {
                    throw "Device node already linked to another gateway spot";
                }
            });
        }
        return next();
    } catch (error) {
        return resError({
            res,
            title: "Device node already linked to another gateway spot",
            errors: error,
        });
    }
};

const deviceNotPair = async (req, res, next) => {
    const duid = req.params.duid || req.body.duid || req.query.duid;
    const ruid = req.params.ruid || req.body.ruid || req.query.ruid;
    try {
        if (ruid) {
            const room = await prisma.room.findUnique({
                where: { ruid },
                select: { device: true },
            });

            if (room.device.device_id === duid) {
                return next();
            }
        }

        if (duid) {
            const device = await prisma.device.findUnique({
                where: {
                    device_id: duid,
                },
                select: { room: true },
            });
            if (device?.room) throw "Process stop, device has paired room";
            if (!device?.room) return next();
        }
    } catch (error) {
        return resError({
            res,
            title: error,
            errors: error,
        });
    }
};

const roomRequestNotExist = async (req, res, next) => {
    try {
        const { ruid, cardNumber: card_number } = req.query;
        const request = await prisma.room_Request.findMany({
            where: {
                room: {
                    is: {
                        ruid,
                    },
                },
                card: {
                    is: {
                        card_number,
                    },
                },
            },
        });
        if (request.length > 0) throw "Request already exist";
        return next();
    } catch (error) {
        return resError({
            res,
            title: "Request already exist!",
            errors: error,
        });
    }
};

const roomAccessNotExist = async (req, res, next) => {
    try {
        const ruid = req.body.ruid || req.query.ruid || req.params.ruid;
        const card_number =
            req.body.cardNumber ||
            req.query.cardNumber ||
            req.params.cardNumber;
        const request = await prisma.room.findMany({
            where: {
                ruid,
                card: {
                    some: { card_number },
                },
            },
        });
        if (request.length > 0) throw "Your card already have access";
        return next();
    } catch (error) {
        return resError({
            res,
            title: "Your card already have access",
            errors: error,
        });
    }
};

const roomAccessIsExist = async (req, res, next) => {
    try {
        // const { ruid, cardNumber: card_number } = req.query;
        const ruid = req.body.ruid || req.query.ruid || req.params.ruid;
        const card_number =
            req.query.cardNumber ||
            req.body.cardNumber ||
            req.params.cardNumber;
        const request = await prisma.room.findMany({
            where: {
                ruid,
                card: {
                    some: { card_number },
                },
            },
        });
        if (request.length < 1) throw "Your card not have access";
        return next();
    } catch (error) {
        return resError({
            res,
            title: "Your card not have access",
            errors: error,
        });
    }
};

const isRoomTurePin = async (req, res, next) => {
    const { oldPin } = req.body;
    const { ruid } = req.params;

    try {
        const { pin } = await prisma.room.findUnique({
            where: {
                ruid,
            },
        });
        const matchPin = hashChecker(oldPin, pin);

        if (!matchPin)
            throw new ErrorException({
                type: "room",
                detail: "Your pin is incorrect, try again",
                location: "Room Middelware",
            });
        return next();
    } catch (error) {
        return resError({
            res,
            title: `${error.room.type} error at ${error.room.location}`,
            errors: error.room.detail,
        });
    }
};

const isDeviceTurePin = async (req, res, next) => {
    const { oldPin } = req.body;
    const { duid } = req.params;

    try {
        const { pin } = await prisma.device.findUnique({
            where: {
                device_id: duid,
            },
        });
        const matchPin = hashChecker(oldPin, pin);

        if (!matchPin)
            throw new ErrorException({
                type: "room",
                detail: "Your pin is incorrect, try again",
                location: "Room Middelware",
            });
        return next();
    } catch (error) {
        return resError({
            res,
            title: `${error.room.type} error at ${error.room.location}`,
            errors: error.room.detail,
        });
    }
};

const cardIsHaveAccess = async (req, res, next) => {
    const { cardNumber } = req.body;
    const { duid } = req.params;

    try {
        const {
            room: { ruid },
        } = await prisma.device.findUnique({
            where: { device_id: duid },
            select: { room: true },
        });
        const room = await prisma.room.findUnique({
            where: {
                ruid,
            },
            include: {
                card: {
                    select: {
                        card_number: true,
                        pin: true,
                        userId: true,
                    },
                },
            },
        });

        // check card can access the room
        const findedCard = room.card.find(
            (card) => card.card_number === cardNumber.replaceAll(" ", "")
        );
        if (!findedCard) throw "You can't access this room";
        return next();
    } catch (error) {
        return resError({
            res,
            title: `Access denied`,
            errors: error,
        });
    }
};

const roomIsActive = async (req, res, next) => {
    const ruid = req.params.ruid || req.body.ruid || req.query.ruid;
    try {
        const room = await prisma.room.findUnique({
            where: {
                ruid,
            },
        });

        if (!room.isActive) throw "Room not activate yet";
        return next();
    } catch (error) {
        return resError({
            res,
            title: error,
            errors: "Room not activate yet",
        });
    }
};

module.exports = {
    roomIsActive,
    roomIsExist,
    roomRequestNotExist,
    roomAccessNotExist,
    isRoomTurePin,
    cardIsHaveAccess,
    deviceIsExist,
    deviceNotPair,
    roomIsPair,
    deviceIsPair,
    roomAccessIsExist,
    isDeviceTurePin,
    deviceTypeIsMultiNetwork,
    deviceNotLinkedToGatewayOtherSpot,
};

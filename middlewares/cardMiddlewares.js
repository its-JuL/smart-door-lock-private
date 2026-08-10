const prisma = require("../prisma/client");
const {
    resError,
    ErrorException,
    resSuccess,
} = require("../services/responseHandler");
const { getUser, hashChecker } = require("../services/auth");

const cardIsExist = async (req, res, next) => {
    const cardNumber =
        req.body.cardNumber || req.params.cardNumber || req.query.cardNumber;
    try {
        const card = await prisma.card.findUnique({
            where: {
                card_number: cardNumber.replaceAll(" ", ""),
            },
        });
        if (!card) throw "Cant find card number";
        return next();
    } catch (error) {
        return resError({
            res,
            title: "Cant find card",
            errors: error,
        });
    }
};

const cardIsPair = async (req, res, next) => {
    const cardNumber = req.body.cardNumber || req.query.cardNumber;
    try {
        const card = await prisma.card.findUnique({
            where: {
                card_number: cardNumber.replaceAll(" ", ""),
            },
        });
        if (card.card_status === "UNREGISTER")
            throw "Card must be pair before take this action";
        return next();
    } catch (error) {
        return resError({
            res,
            title: "Card must be pair before take this action",
            errors: error,
        });
    }
};

const cardNotPair = async (req, res, next) => {
    const cardNumber = req.body.cardNumber;
    try {
        const card = await prisma.card.findUnique({
            where: {
                card_number: cardNumber.replaceAll(" ", ""),
            },
        });
        if (card.card_status === "REGISTER") throw "Card already pair";
        return next();
    } catch (error) {
        return resError({
            res,
            title: error,
            errors: error,
        });
    }
};

const isUserCard = async (req, res, next) => {
    const cardNumber =
        req.body.cardNumber || req.params.cardNumber || req.query.cardNumber;

    const userId = getUser(req);
    try {
        const card = await prisma.card.findUnique({
            where: {
                card_number: cardNumber.replaceAll(" ", ""),
            },
            select: {
                userId: true,
            },
        });

        if (card.userId !== userId) throw "This is not your card";
        return next();
    } catch (error) {
        return resError({
            res,
            title: "You can't perform this action",
            errors: error,
        });
    }
};

const isTurePin = async (req, res, next) => {
    const { oldPin } = req.body;
    const { cardNumber: card_number } = req.params;

    try {
        const { pin, isTwoStepAuth } = await prisma.card.findUnique({
            where: {
                card_number,
            },
        });

        if (isTwoStepAuth == false && pin == null) {
            return next();
        }

        const matchPin = hashChecker(oldPin, pin);

        if (!matchPin)
            throw new ErrorException({
                type: "card",
                detail: "Your pin is incorrect, try again",
                location: "Card Middelware",
            });
        return next();
    } catch (error) {
        console.log(error);
        return resError({
            res,
            title: `Failed to update pin`,
            errors: error,
        });
    }
};

const isNewPinMatch = (req, res, next) => {
    try {
        const { confirmNewPin, newPin } = req.body;
        if (confirmNewPin !== newPin) {
            throw new ErrorException({
                type: "card",
                detail: "Your new pin is not match, try again",
                location: "Card Middelware",
            });
        }
        return next();
    } catch (error) {
        return resError({
            res,
            title: `${error.card.type} error at ${error.card.location}`,
            errors: error.card.detail,
        });
    }
};

/** Fungsi untuk melakukan validasi apakah user mengaktifkan dual step authentication, jika tidak user langsung diberi akses ke rungan, jika user mengaktifkan dual step auth maka validasi pin akan di aktifkan */
const isTwoStepAuth = async (req, res, next) => {
    const { duid } = req.params;
    if (req.body?.pin) {
        return next();
    }
    const {
        room: { ruid },
    } = await prisma.device.findUnique({
        where: { device_id: duid },
        select: { room: true },
    });
    // check if card use two step authentication, if card not use this feature response with true
    const cardNumber =
        req.body.cardNumber || req.params.cardNumber || req.query.cardNumber;

    const card = await prisma.card.findUnique({
        where: { card_number: cardNumber.replaceAll(" ", "") },
        include: { room: true },
    });

    if (!card.isTwoStepAuth) {
        await prisma.rooms_Records.create({
            data: {
                Card: {
                    connect: {
                        card_number: cardNumber.replaceAll(" ", ""),
                    },
                },
                room: {
                    connect: {
                        ruid,
                    },
                },
                isSuccess: true,
            },
        });

        return resSuccess({
            res,
            title: `Success open the room (${ruid})`,
        });
    }

    return next();
};

/** Fungsi untuk memastikan kartu tidak sedang diblokir atau di banned, akan memblokir proses berikutnya jika kartu di blokir*/
const cardIsNotBanned = async (req, res, next) => {
    try {
        const cardNumber =
            req.body.cardNumber ||
            req.params.cardNumber ||
            req.query.cardNumber;

        const card = await prisma.card.findUnique({
            where: {
                card_number: cardNumber.replaceAll(" ", ""),
            },
            select: {
                banned: true,
            },
        });
        if (card.banned) throw "Card is being banned";
        return next();
    } catch (error) {
        return resError({
            res,
            title: `Cant acess room`,
            errors: error,
        });
    }
};

module.exports = {
    cardIsExist,
    cardIsPair,
    isUserCard,
    cardNotPair,
    isTurePin,
    isNewPinMatch,
    isTwoStepAuth,
    cardIsNotBanned,
};

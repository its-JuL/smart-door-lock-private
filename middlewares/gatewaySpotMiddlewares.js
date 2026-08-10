const prisma = require("../prisma/client");
const { resError } = require("../services/responseHandler");

const gatewaySpotIdIsExist = async (req, res, next) => {
    try {
        const id = req.body.id || req.query.id || req.params.id;
        await prisma.gateway_Spot.findUniqueOrThrow({
            where: {
                id,
            },
        });
        return next();
    } catch (error) {
        return resError({
            res,
            title: "Cant find Gateway Spot",
            errors: error,
        });
    }
};

/** Fungsi yang bertujuan untuk menghapus perangkat yang sudah memiliki node terkait */
const gatewaySpotNotHaveLinkingNode = async (req, res, next) => {
    try {
        const id = req.body.id || req.query.id || req.params.id;
        const data = await prisma.gateway_Spot.findUnique({
            where: {
                id,
            },
            select: {
                nodeDevice: true,
            },
        });
        if (data.nodeDevice.length > 0)
            throw "Gateway spot have linking node, please unpair node first";
        return next();
    } catch (error) {
        return resError({
            res,
            title: "Gateway spot have linking node, please unpair node first",
            errors: error,
        });
    }
};

module.exports = { gatewaySpotIdIsExist, gatewaySpotNotHaveLinkingNode };

const prisma = require("../prisma/client");
const { resError } = require("../services/responseHandler");

const gatewayShortIdIsExist = async (req, res, next) => {
    try {
        const gatewayShortId =
            req.body.gatewayShortId ||
            req.query.gatewayShortId ||
            req.params.gatewayShortId;

        await prisma.gateway_Device.findUniqueOrThrow({
            where: {
                gateway_short_id: gatewayShortId,
            },
        });

        return next();
    } catch (error) {
        return resError({
            res,
            title: "Cant find gateway device",
            errors: error,
        });
    }
};

/** Fungsi untuk mengecek apakah perangkat gateway sudah ditautkan ke gateway spot, jika SUDAH maka proses berikutnya akan GAGAL*/
const gatewayDeviceIsNotLinked = async (req, res, next) => {
    try {
        const gatewayShortId =
            req.body.gatewayShortId ||
            req.query.gatewayShortId ||
            req.params.gatewayShortId;

        const id = req.body.id || req.query.id || req.params.id; // gateway spot ID

        const data = await prisma.gateway_Device.findUnique({
            where: {
                gateway_short_id: gatewayShortId,
            },
            select: {
                Gateway_Spot: true,
            },
        });

        if (id) {
            if (id !== data.Gateway_Spot?.id && data.Gateway_Spot !== null) {
                throw "Gateway device already linked to gateway spot";
            }
        }

        if (!id) {
            if (data.Gateway_Spot?.id.length)
                throw "Gateway device already linked to gateway spot";
        }
        return next();
    } catch (error) {
        return resError({
            res,
            title: "Gateway devices have linked gateway spot",
            errors: error,
        });
    }
};

/** Fungsi untuk mengecek apakah perangkat gateway sudah ditautkan ke gateway spot, jika BELUM maka proses berikutnya akan gagal */
const gatewayDeviceIsLinked = async (req, res, next) => {
    try {
        const gatewayShortId =
            req.body.gatewayShortId ||
            req.query.gatewayShortId ||
            req.params.gatewayShortId;

        const data = await prisma.gateway_Device.findUnique({
            where: {
                gateway_short_id: gatewayShortId,
            },
            select: {
                Gateway_Spot: true,
            },
        });
        if (!data.Gateway_Spot?.id.length)
            throw "Gateway device not linked to gateway spot, please link in first";
        return next();
    } catch (error) {
        return resError({
            res,
            title: "Failed to linked device",
            errors: error,
        });
    }
};

module.exports = {
    gatewayShortIdIsExist,
    gatewayDeviceIsNotLinked,
    gatewayDeviceIsLinked,
};

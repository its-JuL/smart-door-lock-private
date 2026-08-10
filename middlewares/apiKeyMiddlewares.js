const prisma = require("../prisma/client");
const { verifyJwt } = require("../services/auth");
const { ErrorException, resError } = require("../services/responseHandler");
const location = "API Key Middlewares";
const apiIDIsExist = async (req, res, next) => {
    const { id } = req.params;
    try {
        const key = await prisma.api_Key.findUnique({ where: { id } });
        if (!key)
            throw new ErrorException({
                type: "Api Key",
                detail: "Can't Find API Key",
                location,
            });
        return next();
    } catch (error) {
        return resError({
            res,
            title: "Cant find API",
        });
    }
};

const apiValidation = async (req, res, next) => {
    const { id, key: secret } = req.query;
    try {
        if (!(id && secret))
            throw new ErrorException({
                type: "Api Key",
                detail: "Missing API ID & API Key",
                location,
            });
        const { secret: serverSideSecret } = await prisma.api_Key.findUnique({
            where: { id },
        });
        if (!(serverSideSecret === secret))
            throw new ErrorException({
                type: "Api Key",
                detail: "API ID and/or API Key not match",
                location,
            });
        return next();
    } catch (error) {
        return resError({
            res,
            title: "Cant find the api",
        });
    }
};

const apiJWTValidation = async (req, res, next) => {
    try {
        const apiID = req.headers["x-api-id"];
        const apiSecret = req.headers["x-api-secret"];

        if (!apiID) throw "API ID Not Define"; // throw error when api id not define
        if (!apiSecret) throw "API key Not Define"; // throw error when api key not define

        const apiData = await prisma.api_Key.findUnique({
            where: { id: apiID },
        });

        if (!apiData) throw "Cant find API Data"; // jika api id tidak ada di database maka throw error

        const jwtPayload = verifyJwt(apiSecret, apiData.secret); // verifikasi jwt berdasarkan database secret
        if (jwtPayload === undefined) throw "Cant Verify JWT Token"; // jika jwt tidak bisa di verifikasi maka throw error

        if (
            jwtPayload["api-id"] !== apiData.id ||
            jwtPayload["api-key"] !== apiData.secret
        )
            throw "Secret Payload not match"; // jika payload tidak sesuai maka throw error

        return next();
    } catch (error) {
        return resError({
            res,
            title: "API Authentication Failed",
            errors: error,
        });
    }
};

module.exports = { apiIDIsExist, apiValidation, apiJWTValidation };

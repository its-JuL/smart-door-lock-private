const prisma = require("../../prisma/client");
const { random: stringGenerator } = require("@supercharge/strings");
const {
    resSuccess,
    resError,
    ErrorException,
} = require("../../services/responseHandler");
const ITEM_LIMIT = Number(process.env.ITEM_LIMIT) || 10;

/** Fungsi untuk membuat API KEY Untuk pintu */
exports.createApiKey = async (req, res) => {
    try {
        const secret = stringGenerator(32);
        const key = await prisma.api_Key.create({ data: { secret } });
        return resSuccess({
            res,
            title: "Success generate api key",
            data: key,
        });
    } catch (error) {
        return resError({
            res,
            title: "Failed to create api key",
            errors: error,
        });
    }
};

/** Fungsi Untuk Menampilkan semua daftar API KEY */
exports.apiKeyList = async (req, res) => {
    const { cursor, search } = req.query;
    let apiKeyList;
    try {
        if (!search) {
            if (!cursor) {
                apiKeyList = await prisma.api_Key.findMany({
                    orderBy: {
                        createdAt: "asc",
                    },
                    take: ITEM_LIMIT,
                });
            }
            if (cursor) {
                apiKeyList = await prisma.api_Key.findMany({
                    orderBy: {
                        createdAt: "asc",
                    },
                    take: ITEM_LIMIT,
                    skip: 1,
                    cursor: {
                        id: cursor,
                    },
                });
            }
        }

        if (search) {
            if (!cursor) {
                apiKeyList = await prisma.api_Key.findMany({
                    where: {
                        secret: { contains: search, mode: "insensitive" },
                    },
                    orderBy: {
                        createdAt: "asc",
                    },
                    take: ITEM_LIMIT,
                });
            }
            if (cursor) {
                apiKeyList = await prisma.api_Key.findMany({
                    where: {
                        secret: { contains: search, mode: "insensitive" },
                    },
                    orderBy: {
                        createdAt: "asc",
                    },
                    take: ITEM_LIMIT,
                    skip: 1,
                    cursor: {
                        id: cursor,
                    },
                });
            }
        }

        return resSuccess({
            res,
            title: "Success listed all api key",
            data: apiKeyList,
        });
    } catch (error) {
        return resError({ res, errors: error });
    }
};

/** Fungsi untuk menghapus daftar api key */
exports.delete = async (req, res) => {
    const { id } = req.params;
    try {
        const deletedKey = await prisma.api_Key.delete({ where: { id } });
        return resSuccess({
            res,
            title: "Success deleted api key",
            data: deletedKey,
        });
    } catch (error) {
        return resError({ res, errors: error });
    }
};

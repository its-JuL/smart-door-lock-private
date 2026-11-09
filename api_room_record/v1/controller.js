const prisma = require("../../prisma/client");
const { resSuccess, resError } = require("../../services/responseHandler");
const { roomWhereForScope } = require("../../services/operatorScope");
const ITEM_LIMIT = Number(process.env.ITEM_LIMIT) || 10;

/** Fungsi untuk menampilkan seluruh data log atau room record */
exports.logs = async (req, res) => {
    const { search, cursor } = req.query;
    let roomRecords;
    try {
        const scopedRoom = roomWhereForScope(req.accessScope);
        if (search) {
            if (!cursor) {
                roomRecords = await prisma.rooms_Records.findMany({
                    where: {
                        room: {
                            name: { contains: search, mode: "insensitive" },
                            ...scopedRoom,
                        },
                    },
                    orderBy: {
                        createdAt: "asc",
                    },
                    take: ITEM_LIMIT,
                });
            }

            if (cursor) {
                roomRecords = await prisma.rooms_Records.findMany({
                    where: {
                        room: {
                            name: { contains: search, mode: "insensitive" },
                            ...scopedRoom,
                        },
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

        if (!search) {
            if (!cursor) {
                roomRecords = await prisma.rooms_Records.findMany({
                    where: {
                        room: scopedRoom,
                    },
                    orderBy: {
                        createdAt: "asc",
                    },
                    take: ITEM_LIMIT,
                });
            }

            if (cursor) {
                roomRecords = await prisma.rooms_Records.findMany({
                    where: {
                        room: scopedRoom,
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
            title: "Success listed logs",
            data: roomRecords,
        });
    } catch (error) {
        return resError({
            res,
            title: "Failed to load room record",
            errors: error,
        });
    }
};

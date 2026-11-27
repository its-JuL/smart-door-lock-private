const prisma = require("../../prisma/client");
const { resSuccess, resError } = require("../../services/responseHandler");
const { roomWhereForScope } = require("../../services/operatorScope");
const ITEM_LIMIT = Number(process.env.ITEM_LIMIT) || 25;

/** Riwayat autentikasi terpadu, dibatasi scope room operator. */
exports.logs = async (req, res) => {
    const {
        search,
        cursor,
        deviceId,
        authenticationMethod,
        isSuccess,
    } = req.query;

    try {
        const where = {};
        if (req.accessScope?.type !== "ALL") {
            where.room = roomWhereForScope(req.accessScope);
        }
        if (deviceId) where.deviceId = deviceId;
        if (authenticationMethod) where.authenticationMethod = authenticationMethod;
        if (isSuccess === "true" || isSuccess === "false") {
            where.isSuccess = isSuccess === "true";
        }
        if (search) {
            where.OR = [
                { room: { name: { contains: search, mode: "insensitive" } } },
                { device: { device_id: { contains: search, mode: "insensitive" } } },
                { user: { username: { contains: search, mode: "insensitive" } } },
                { user: { profil: { full_name: { contains: search, mode: "insensitive" } } } },
                { detail: { contains: search, mode: "insensitive" } },
            ];
        }

        const roomRecords = await prisma.rooms_Records.findMany({
            where,
            include: {
                user: {
                    select: {
                        id: true,
                        username: true,
                        email: true,
                        profil: { select: { full_name: true, photo: true } },
                    },
                },
                room: {
                    select: {
                        id: true,
                        ruid: true,
                        name: true,
                        Building: { select: { id: true, name: true } },
                    },
                },
                device: {
                    select: {
                        id: true,
                        device_id: true,
                        firmwareVersion: true,
                        lastOnline: true,
                    },
                },
            },
            orderBy: { createdAt: "desc" },
            take: ITEM_LIMIT,
            ...(cursor ? { skip: 1, cursor: { id: cursor } } : {}),
        });

        return resSuccess({
            res,
            title: "Success listed authentication history",
            data: roomRecords,
        });
    } catch (error) {
        return resError({
            res,
            title: "Failed to load authentication history",
            errors: error,
        });
    }
};

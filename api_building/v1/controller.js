const prisma = require("../../prisma/client");
const { resSuccess, resError } = require("../../services/responseHandler");
// const ITEM_LIMIT = Number(process.env.ITEM_LIMIT) || 10;
const ITEM_LIMIT = 5;

exports.create = async (req, res) => {
    try {
        const { name, usernames, ruids } = req.body;
        const building = await prisma.building.create({
            data: {
                name,
                rooms: {
                    connect: ruids.map((ruid) => ({ ruid: ruid })),
                },
                operator: {
                    connect: usernames.map((user) => ({ username: user })),
                },
            },
        });
        return resSuccess({ res, code: 201, data: building });
    } catch (error) {
        return resError({ res, title: "Cant create Building", errors: error });
    }
};

exports.update = async (req, res) => {
    try {
        const { name, usernames, ruids, buildingId } = req.body;
        const building = await prisma.building.update({
            where: {
                id: buildingId,
            },
            data: {
                name,
                rooms: {
                    set: ruids.map((ruid) => ({ ruid: ruid })),
                },
                operator: {
                    set: usernames.map((user) => ({ username: user })),
                },
            },
        });
        return resSuccess({
            res,
            code: 200,
            data: building,
            title: "Success update building",
        });
    } catch (error) {
        return resError({ res, title: "Cant update Building", errors: error });
    }
};

exports.delete = async (req, res) => {
    try {
        const { buildingId } = req.body;
        const deletedBuilding = await prisma.building.delete({
            where: { id: buildingId },
        });
        return resSuccess({
            res,
            title: "Success delete building",
            data: deletedBuilding,
        });
    } catch (error) {
        return resError({ res, title: "Cant delete Building", errors: error });
    }
};

exports.list = async (req, res) => {
    try {
        const { search, cursor } = req.query;
        let buildingList;
        if (search) {
            if (!cursor) {
                buildingList = await prisma.building.findMany({
                    where: {
                        name: {
                            contains: search,
                            mode: "insensitive",
                        },
                    },
                    orderBy: {
                        name: "asc",
                    },
                    take: ITEM_LIMIT,
                    select: {
                        id: true,
                        name: true,
                        createdAt: true,
                        rooms: { select: { name: true } },
                        operator: { select: { username: true } },
                    },
                });
            }

            if (cursor) {
                buildingList = await prisma.building.findMany({
                    where: {
                        name: {
                            contains: search,
                            mode: "insensitive",
                        },
                    },
                    orderBy: {
                        name: "asc",
                    },
                    take: ITEM_LIMIT,
                    skip: 1,
                    cursor: {
                        id: cursor,
                    },
                    select: {
                        id: true,
                        name: true,
                        createdAt: true,
                        rooms: { select: { name: true } },
                        operator: { select: { username: true } },
                    },
                });
            }
        }

        if (!search) {
            if (!cursor) {
                buildingList = await prisma.building.findMany({
                    orderBy: {
                        name: "asc",
                    },
                    take: ITEM_LIMIT,
                    select: {
                        id: true,
                        name: true,
                        createdAt: true,
                        rooms: { select: { name: true } },
                        operator: { select: { username: true } },
                    },
                });
            }
            if (cursor) {
                buildingList = await prisma.building.findMany({
                    orderBy: {
                        name: "asc",
                    },
                    take: ITEM_LIMIT,
                    skip: 1,
                    cursor: {
                        id: cursor,
                    },
                    select: {
                        id: true,
                        name: true,
                        createdAt: true,
                        rooms: { select: { name: true } },
                        operator: { select: { username: true } },
                    },
                });
            }
        }

        return resSuccess({
            res,
            title: "Success get building list",
            data: buildingList,
        });
    } catch (error) {
        return resError({
            res,
            title: "Cant get building list",
            errors: error,
        });
    }
};

exports.detail = async (req, res) => {
    try {
        const { buildingId: id } = req.params;
        const data = await prisma.building.findUnique({
            where: { id },
            select: {
                name: true,
                operator: { select: { username: true } },
                rooms: { select: { ruid: true, name: true } },
            },
        });
        return resSuccess({ res, title: "Success get building detail", data });
    } catch (error) {
        return resError({
            res,
            title: "Cant get building detail information",
            errors: error,
        });
    }
};

exports.generalinformation = async (req, res) => {
    try {
        const numberOfBuildings = await prisma.building.count();
        const numberOfOperators = await prisma.user.count({
            where: { role: { name: "OPERATOR" } },
        });
        const buildingList = await prisma.building.findMany({
            orderBy: {
                name: "asc",
            },
            take: ITEM_LIMIT,
            select: {
                id: true,
                name: true,
                createdAt: true,
                rooms: { select: { name: true } },
            },
        });
        return resSuccess({
            res,
            title: "Success get building information",
            data: { numberOfBuildings, numberOfOperators, buildingList },
        });
    } catch (error) {
        return resError({
            res,
            title: "Cant get building information",
            errors: error,
        });
    }
};

exports.autocomplate = async (req, res) => {
    try {
        const search = req.query.term;
        const results = [];
        const searchResult = await prisma.building.findMany({
            where: {
                name: {
                    contains: search,
                    mode: "insensitive",
                },
            },
            select: {
                name: true,
                id: true,
            },
            take: ITEM_LIMIT,
        });

        searchResult.forEach((data) => {
            const { name, id } = data;
            results.push({ value: id, label: name });
        });

        return res.status(200).json(results);
    } catch (error) {
        return resError({
            res,
            title: "Cant get building information",
            errors: error,
        });
    }
};

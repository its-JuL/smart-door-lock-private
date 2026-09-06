const prisma = require("../../prisma/client");
const { resSuccess, resError } = require("../../services/responseHandler");
const ITEM_LIMIT = Number(process.env.CARD_ITEM_LIMIT) || 10;
// const ITEM_LIMIT = 1;
const { MQTTConnection } = require("../../connection/mqtt");

exports.gatewaySpotLinktoGatewayDevice = async (req, res) => {
    try {
        const { name, gatewayShortId } = req.body;
        const data = await prisma.gateway_Spot.create({
            data: {
                name,
                gatewayDevice: {
                    connect: {
                        gateway_short_id: gatewayShortId,
                    },
                },
            },
        });

        const dataToSend = {
            name: data.name,
            createdAt: data.createdAt,
        };

        // INFO: BROADCAST DATA TO GATEWAY
        MQTTConnection.publish(
            `setup/${gatewayShortId}/gateway`,
            dataToSend
        ); // broadcast info to gateway

        return resSuccess({
            res,
            title: "Success linked gateway device to gateway spot",
            data: data,
        });
    } catch (error) {
        return resError({
            res,
            title: "Failed to get gateway list",
            errors: error,
        });
    }
};

exports.detail = async (req, res) => {
    try {
        const { id } = req.params;
        const data = await prisma.gateway_Spot.findUnique({
            where: { id },
            select: {
                id: true,
                name: true,
                gatewayDevice: {
                    select: {
                        id: true,
                        gateway_short_id: true,
                    },
                },
                nodeDevice: {
                    select: {
                        id: true,
                        device_id: true,
                        deviceType: true,
                        room: {
                            select: {
                                id: true,
                                name: true,
                                card: {
                                    select: {
                                        card_number: true,
                                    },
                                },
                            },
                        },
                    },
                },
            },
        });
        return resSuccess({
            res,
            title: "Success get Gateway Spot detail",
            data,
        });
    } catch (error) {
        return resError({
            res,
            title: "Failed to get gateway detail information",
            errors: error,
        });
    }
};

exports.list = async (req, res) => {
    try {
        const { search, cursor } = req.query;
        let gatewayList;
        if (search) {
            if (!cursor) {
                gatewayList = await prisma.gateway_Spot.findMany({
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
                        gatewayDevice: {
                            select: {
                                gateway_short_id: true,
                            },
                        },
                        nodeDevice: {
                            select: {
                                device_id: true,
                            },
                        },
                    },
                });
            }

            if (cursor) {
                gatewayList = await prisma.gateway_Spot.findMany({
                    where: {
                        name: {
                            contains: search,
                            mode: "insensitive",
                        },
                    },
                    take: ITEM_LIMIT,
                    skip: 1,
                    cursor: {
                        id: cursor,
                    },
                    orderBy: {
                        name: "asc",
                    },
                    select: {
                        id: true,
                        name: true,
                        createdAt: true,
                        gatewayDevice: {
                            select: {
                                gateway_short_id: true,
                            },
                        },
                        nodeDevice: {
                            select: {
                                device_id: true,
                            },
                        },
                    },
                });
            }
        }

        if (!search) {
            if (!cursor) {
                gatewayList = await prisma.gateway_Spot.findMany({
                    orderBy: {
                        name: "asc",
                    },
                    take: ITEM_LIMIT,
                    select: {
                        id: true,
                        name: true,
                        createdAt: true,
                        gatewayDevice: {
                            select: {
                                gateway_short_id: true,
                            },
                        },
                        nodeDevice: {
                            select: {
                                device_id: true,
                            },
                        },
                    },
                });
            }
            if (cursor) {
                gatewayList = await prisma.gateway_Spot.findMany({
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
                        gatewayDevice: {
                            select: {
                                gateway_short_id: true,
                            },
                        },
                        nodeDevice: {
                            select: {
                                device_id: true,
                            },
                        },
                    },
                });
            }
        }

        return resSuccess({
            res,
            title: "Success get gateway spot list",
            data: gatewayList,
        });
    } catch (error) {
        return resError({
            res,
            title: "Failed to get list of gateway spot",
            errors: error,
        });
    }
};

exports.delete = async (req, res) => {
    try {
        const { id } = req.body;
        const data = await prisma.gateway_Spot.delete({
            where: { id },
            select: {
                name: true,
                id: true,
                createdAt: true,
                gatewayDevice: {
                    select: {
                        gateway_short_id: true,
                    },
                },
            },
        });
        const dataToSend = {
            name: data.name,
            gatewayShortId: data.gatewayDevice.gateway_short_id,
        };

        // INFO: BROADCAST DATA TO GATEWAY
        MQTTConnection.publish(
            `reset/${data.gatewayDevice.gateway_short_id}/gateway`,
            dataToSend
        ); // broadcast info to gateway
        return resSuccess({ res, title: "Success delete gateway spot", data });
    } catch (error) {
        return resError({
            res,
            title: "Failed to delete of gateway spot",
            errors: error,
        });
    }
};

exports.update = async (req, res) => {
    try {
        const { name, gatewayShortId, id, duid: unfilterDuid } = req.body;
        const duid = [...new Set(unfilterDuid)];
        const data = await prisma.gateway_Spot.update({
            where: {
                id,
            },
            data: {
                name,
                nodeDevice: {
                    set: duid.map((id) => ({ device_id: id })),
                },
            },
            select: {
                gatewayDevice: {
                    select: {
                        gateway_short_id: true,
                    },
                },
            },
        });

        // update last gateway pada setiap device id
        duid.forEach(async (d) => {
            await prisma.device.update({
                where: {
                    device_id: d,
                },
                data: {
                    deviceLastGateway: data.gatewayDevice.gateway_short_id,
                },
            });
        });

        // mengubah gateway device
        if (data.gatewayDevice.gateway_short_id !== gatewayShortId) {
            await prisma.gateway_Device.update({
                where: {
                    gateway_short_id: gatewayShortId,
                },
                data: {
                    Gateway_Spot: {
                        connect: {
                            id,
                        },
                    },
                },
            });
        }
        return resSuccess({
            res,
            title: "Success update gateway spot",
            data: { name, gatewayShortId },
        });
    } catch (error) {
        return resError({
            res,
            title: "Failed to update gateway spot",
            errors: error,
        });
    }
};

exports.generalInformation = async (req, res) => {
    try {
        const countOfGatewaySpot = await prisma.gateway_Spot.count();
        const countOfNodwWithMultiNetworkType = await prisma.device.count({
            where: { deviceType: "MULTI_NETWORK" },
        });
        const gatewayList = await prisma.gateway_Spot.findMany({
            orderBy: {
                name: "asc",
            },
            take: ITEM_LIMIT,
            select: {
                id: true,
                name: true,
                createdAt: true,
                gatewayDevice: {
                    select: {
                        gateway_short_id: true,
                    },
                },
                nodeDevice: {
                    select: {
                        device_id: true,
                    },
                },
            },
        });
        return resSuccess({
            res,
            title: "Success get gateway spot general information",
            data: {
                gatewayList,
                countOfGatewaySpot,
                countOfNodwWithMultiNetworkType,
            },
        });
    } catch (error) {
        return resError({
            res,
            title: "Failed to get gateway spot information",
            errors: error,
        });
    }
};

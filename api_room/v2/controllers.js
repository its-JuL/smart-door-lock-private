const prisma = require("../../prisma/client");
const {
    ErrorException,
    resError,
    resSuccess,
} = require("../../services/responseHandler");
const { random: stringGenerator } = require("@supercharge/strings");
const { hashChecker, hasher } = require("../../services/auth");
const {
    emailAcceptanceOfAccessRequestsTemplate,
    sendEmail,
} = require("../../services/mailing");
const { MQTTConnection } = require("../../connection/mqtt");
const FEATURE_ROOM_NOTIFICATION = process.env.FEATURE_ROOM_NOTIFICATION;

const ITEM_LIMIT = Number(process.env.ITEM_LIMIT) || 10;

/**
 * Fungsi yang digunakan oleh perangkat keras, fungsi nya adalah membuat perangkat
 */
exports.createDevice = async (req, res) => {
    try {
        let duid = stringGenerator(5);
        let generateDUID = true;
        while (generateDUID) {
            const ruidIsEmpty = await prisma.device.findUnique({
                where: {
                    device_id: duid,
                },
            });

            if (!ruidIsEmpty) {
                generateDUID = false;
                break;
            }

            duid = stringGenerator(5);
        }

        const newDevice = await prisma.device.create({
            data: {
                device_id: duid,
                lastOnline: new Date(),
            },
        });
        return resSuccess({
            res,
            title: "Success register device",
            data: newDevice,
            code: 201,
        });
    } catch (err) {
        return resError({ res, errors: err });
    }
};

/**
 * Fungsi yang digunakan untuk menautkan perangkat dengan ruangan yang akan di buat
 */
exports.createRoom = async (req, res) => {
    const { name, duid, buildingId } = req.body;
    try {
        let ruid = stringGenerator(5);
        let generateRUID = true;
        while (generateRUID) {
            const ruidIsEmpty = await prisma.room.findUnique({
                where: {
                    ruid,
                },
            });

            if (!ruidIsEmpty) {
                generateRUID = false;
                break;
            }

            ruid = stringGenerator(5);
        }

        const newRoom = await prisma.room.create({
            data: {
                ruid,
                name,
                isActive: true,
                device: {
                    connect: {
                        device_id: duid,
                    },
                },
                buildingId,
            },
            select: {
                ruid: true,
                name: true,
                isActive: true,
                buildingId: true,
                device: {
                    select: {
                        deviceType: true,
                        device_id: true,
                        Gateway_Spot: {
                            select: {
                                gatewayDevice: {
                                    select: {
                                        gateway_short_id: true,
                                    },
                                },
                            },
                        },
                    },
                },
            },
        });

        if (newRoom.device.deviceType === "MULTI_NETWORK") {
            const dataToSend = {
                device_id: newRoom.device.device_id,
                name: newRoom.name,
            };

            // INFO: BROADCAST DATA TO GATEWAY
            MQTTConnection.publish(
                `setuproom/${newRoom.device.Gateway_Spot.gatewayDevice.gateway_short_id}/gateway`,
                dataToSend
            );
        }

        return resSuccess({
            res,
            title: "Success pairing room and device",
            data: newRoom,
        });
    } catch (error) {
        return resError({ res, errors: error });
    }
};

/**
 * Fungsi untuk menampilkan informasi suatu ruangan berdasarkan DUID (Device Unique ID)
 */
exports.deviceDetail = async (req, res) => {
    const { duid } = req.params; // stands for room unique id
    try {
        await prisma.device.update({
            where: { device_id: duid },
            data: { lastOnline: new Date() },
        });

        const detailRoom = await prisma.device.findUnique({
            where: {
                device_id: duid,
            },
        });

        return resSuccess({
            res,
            title: "Succes get device information",
            data: detailRoom,
        });
    } catch (err) {
        return resError({ res, errors: err, code: 422 });
    }
};

/**
 * Fungsi untuk melakukan update kapan terkahir kalinya perangkat dalam kondisi online
 */
exports.onlineUpdate = async (req, res) => {
    const { duid } = req.params; // stands for room unique id
    const responsesTime = req.body?.responsesTime;
    try {
        const detailRoom = await prisma.device.update({
            where: { device_id: duid },
            data: { lastOnline: new Date() },
        });

        if (responsesTime !== undefined) {
            const dataToSend = {
                duid,
                deviceType: detailRoom.deviceType,
                responsesTime: responsesTime.split(",").slice(0, -1),
            };

            MQTTConnection.publish(
                "logger.save",
                JSON.stringify(dataToSend)
            );
        }

        return resSuccess({
            res,
            title: "Succes update device last online information",
            data: detailRoom,
        });
    } catch (err) {
        return resError({ res, errors: err, code: 422 });
    }
};

/**
 * Fungsi ini akan digunakan perangkat keras. Fungsi yang berguna untuk mengecek kartu, pin dan ruangan yang akan dimasuki user,
 */
exports.roomCheckIn = async (req, res) => {
    const { duid } = req.params;
    const {
        room: { ruid },
    } = await prisma.device.findUnique({
        where: { device_id: duid },
        select: { room: true },
    });
    // che
    const { cardNumber, pin } = req.body;
    try {
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

        const findedCard = room.card.find(
            (card) => card.card_number === cardNumber.replaceAll(" ", "")
        );

        const matchPin = hashChecker(pin, findedCard.pin);

        if (!matchPin)
            throw new ErrorException({
                type: "card",
                detail: "Your pin is incorrect, try again",
                location: "Room Controller",
            });

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
            title: `Success open the room (${room.ruid})`,
        });
    } catch (error) {
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
                isSuccess: false,
            },
        });
        return resError({
            res,
            title: "Failed to open the room",
            errors: error,
            code: 401,
        });
    }
};

/** Fungsi untuk validasi pin pintu */
exports.validatePin = async (req, res) => {
    const { duid } = req.params;
    const { pin } = req.body;
    try {
        const device = await prisma.device.findUnique({
            where: { device_id: duid },
        });

        const validate = hashChecker(pin, device.pin);
        if (!validate)
            throw new ErrorException({
                type: "room",
                detail: "Pin not match",
                location: "Room Controller",
            });

        return resSuccess({
            res,
            title: "Success to validate pin",
            data: { validate },
        });
    } catch (error) {
        return resError({
            res,
            title: "Failed to validate pin",
            errors: error,
        });
    }
};

/** Fungsi untuk menampilkan daftar perangkat */
exports.deviceList = async (req, res) => {
    const { search, cursor, available } = req.query;
    let deviceList;
    try {
        if (search) {
            if (!cursor) {
                deviceList = await prisma.device.findMany({
                    where: {
                        device_id: {
                            contains: search,
                            mode: "insensitive",
                        },
                    },
                    orderBy: {
                        createdAt: "asc",
                    },
                    take: ITEM_LIMIT,
                });
            }

            if (cursor) {
                deviceList = await prisma.device.findMany({
                    where: {
                        device_id: {
                            contains: search,
                            mode: "insensitive",
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
                deviceList = await prisma.device.findMany({
                    orderBy: {
                        createdAt: "asc",
                    },
                    take: ITEM_LIMIT,
                });
            }
            if (cursor) {
                deviceList = await prisma.device.findMany({
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

        if (available === "true") {
            if (search) {
                if (!cursor) {
                    deviceList = await prisma.device.findMany({
                        where: {
                            device_id: {
                                contains: search,
                                mode: "insensitive",
                            },
                            roomId: null,
                        },
                        orderBy: {
                            createdAt: "asc",
                        },
                        take: ITEM_LIMIT,
                    });
                }

                if (cursor) {
                    deviceList = await prisma.device.findMany({
                        where: {
                            device_id: {
                                contains: search,
                                mode: "insensitive",
                            },
                            roomId: null,
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
                    deviceList = await prisma.device.findMany({
                        where: {
                            roomId: null,
                        },
                        orderBy: {
                            createdAt: "asc",
                        },
                        take: ITEM_LIMIT,
                    });
                }
                if (cursor) {
                    deviceList = await prisma.device.findMany({
                        where: {
                            roomId: null,
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
        }

        return resSuccess({
            res,
            title: "Success listed available device",
            data: deviceList,
        });
    } catch (error) {
        return resError({
            res,
            title: "Failed to list device",
            errors: error,
        });
    }
};

/** Fungsi untuk menghapus device */
exports.deviceDelete = async (req, res) => {
    console.log("DEVICE DELETE");
    const { duid } = req.params;
    try {
        const deviceInfo = await prisma.device.findUnique({
            where: { device_id: duid },
            select: { room: true },
        });

        if (deviceInfo?.room) {
            await prisma.device.update({
                where: { device_id: duid },
                data: { room: { update: { isActive: false } } },
            });
        }

        const device = await prisma.device.delete({
            where: { device_id: duid },
            select: {
                id: true,
                device_id: true,
                deviceType: true,
                deviceLastGateway: true,
                Gateway_Spot: {
                    select: {
                        gatewayDevice: {
                            select: {
                                gateway_short_id: true,
                            },
                        },
                    },
                },
            },
        });

        // INFO: BROADCAST DATA TO GATEWAY
        if (device.deviceType == "MULTI_NETWORK") {
            const dataToSend = {
                device_id: device.device_id,
            };

            let gatewayShortId =
                device?.Gateway_Spot?.gatewayDevice?.gateway_short_id;
            if (!gatewayShortId) {
                gatewayShortId = device?.deviceLastGateway;
            }

            MQTTConnection.publish(
                `removeroom/${gatewayShortId}/gateway`,
                dataToSend
            );
        }

        return resSuccess({
            res,
            title: "Success delete device, set room to false",
            data: { device },
        });
    } catch (error) {
        console.log("ERROR", error);
        return resError({
            res,
            title: "Failed to delete device",
            errors: error,
        });
    }
};

/** Fungsi untuk mengubah pin device pintu */
exports.changePin = async (req, res) => {
    const { duid } = req.params;
    const { newPin } = req.body;

    try {
        const device = await prisma.device.update({
            where: { device_id: duid },
            data: {
                pin: hasher(newPin),
            },
        });

        return resSuccess({
            res,
            title: "Success change pin",
            data: device,
        });
    } catch (error) {
        return resError({
            res,
            title: "Failed to change pin",
            errors: error,
        });
    }
};

/**
 * Fungsi untuk menautkan ruangan dengan kartu, fungsi ini akan memberi akses kepada kartu untuk mengakses ruangan tertentu
 */
exports.pairRoomToCard = async (req, res) => {
    const { ruid, cardNumber } = req.query;
    try {
        const updatedRoom = await prisma.room.update({
            where: {
                ruid,
            },
            data: {
                card: {
                    connect: {
                        card_number: cardNumber,
                    },
                },
            },
            select: {
                name: true,
                device: {
                    select: {
                        device_id: true,
                        deviceType: true,
                        Gateway_Spot: {
                            select: {
                                gatewayDevice: {
                                    select: {
                                        gateway_short_id: true,
                                    },
                                },
                            },
                        },
                    },
                },
                card: {
                    where: {
                        card_number: cardNumber,
                    },
                    select: {
                        card_name: true,
                        card_number: true,
                        pin: true,
                        isTwoStepAuth: true,
                        card_status: true,
                        banned: true,
                        user: {
                            select: {
                                username: true,
                                email: true,
                            },
                        },
                    },
                },
            },
        });

        await prisma.room_Request.deleteMany({
            where: { card: { card_number: cardNumber }, room: { ruid } },
        });

        // INFO: BROADCAST DATA TO GATEWAY
        if (updatedRoom.device.deviceType === "MULTI_NETWORK") {
            const dataToSend = {
                cardNumber: cardNumber,
                cardPin: updatedRoom.card[0].pin,
                isTwoStepAuth: updatedRoom.card[0].isTwoStepAuth,
                cardStatus: updatedRoom.card[0].card_status,
                isBanned: updatedRoom.card[0].banned,
                duid: updatedRoom.device.device_id,
                createdAt: new Date(),
            };

            MQTTConnection.publish(
                `addcard/${updatedRoom.device.Gateway_Spot.gatewayDevice.gateway_short_id}/gateway`,
                dataToSend
            );
        }

        if (FEATURE_ROOM_NOTIFICATION == "true") {
            const subject = "Acceptance of Access Requests";
            const template = emailAcceptanceOfAccessRequestsTemplate({
                username: updatedRoom.card[0].user.username,
                subject,
                text_description: `We are pleased to inform you that your request for access to ${updatedRoom.name} has been approved.`,
            });
            await sendEmail(updatedRoom.card[0].user.email, subject, template);
        }

        return resSuccess({
            res,
            title: "Sukses memberi akses",
            data: updatedRoom,
        });
    } catch (error) {
        return resError({
            res,
            title: "Gagal memberi akses ruangan",
            errors: error,
        });
    }
};

/** Fungsi untuk menampilkan daftar perangkat untuk keperluan autocomplate */
exports.autocomplate = async (req, res) => {
    try {
        const search = req.query.term;
        const type = req.query.type;
        const results = [];
        const searchResult = await prisma.device.findMany({
            where: {
                device_id: {
                    contains: search,
                    mode: "insensitive",
                },
                deviceType: type,
            },
            select: {
                device_id: true,
                id: true,
            },
            take: ITEM_LIMIT,
        });

        searchResult.forEach((data) => {
            const { device_id, id } = data;
            results.push({ value: device_id, label: device_id });
        });

        return res.status(200).json(results);
    } catch (error) {
        return resError({
            res,
            title: "Cant get device information",
            errors: error,
        });
    }
};

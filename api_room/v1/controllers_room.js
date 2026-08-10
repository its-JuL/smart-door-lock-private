const {
    resError,
    resSuccess,
    ErrorException,
} = require("../../services/responseHandler");
const { getUser, hashChecker, hasher } = require("../../services/auth");
const prisma = require("../../prisma/client");
const {
    sendEmail,
    emailDeclineOfAccessRequestsTemplate,
} = require("../../services/mailing");
const { random: stringGenerator } = require("@supercharge/strings");
const ITEM_LIMIT = Number(process.env.ITEM_LIMIT) || 20;
const { MQTTConnection } = require("../../connection/mqtt");
const FEATURE_ROOM_NOTIFICATION = process.env.FEATURE_ROOM_NOTIFICATION;
// const ITEM_LIMIT = 1;

// INFO: Prisma middleware to encrypt default room pin
prisma.$use(async (params, next) => {
    const result = await next(params);
    if (
        params.action === "create" &&
        params.model === "Room" &&
        result.pin === "220982"
    ) {
        result.pin = hasher(result.pin);
        await prisma.room.update({
            where: {
                id: result.id,
            },
            data: {
                pin: result.pin,
            },
        });
    }
    return result;
});

/**
 * Fungsi yang digunakan oleh perangkat keras, fungsi nya adalah membuat atau menampilkan data ruangan dengan Room Unique ID yang tertanam di perangkat
 */
exports.getOrCreateRoom = async (req, res) => {
    const ruid = req.body.ruid; // stands for room unique id
    try {
        const getRoom = await prisma.room.findUnique({
            where: {
                ruid: ruid,
            },
        });

        // jika ruangan belum ada (!null berarti true)
        if (!getRoom) {
            const newRoom = await prisma.room.create({
                data: {
                    ruid: ruid,
                    name: ruid,
                },
            });
            return resSuccess({
                res,
                title: "Success created room",
                data: newRoom,
                code: 201,
            });
        }

        return resSuccess({
            res,
            title: "Succes get room information",
            data: getRoom,
        });
    } catch (err) {
        return resError({ res, errors: err });
    }
};

/**
 * Fungsi untuk menampilkan informasi suatu ruangan berdasarkan RUID (Room Unique ID)
 */
exports.detail = async (req, res) => {
    const ruid = req.params.ruid; // stands for room unique id
    try {
        const detailRoom = await prisma.room.findUnique({
            where: {
                ruid: ruid,
            },
            include: {
                device: true,
            },
        });

        const numberOfVisitor = await prisma.rooms_Records.count({
            where: {
                room: {
                    ruid,
                },
            },
        });
        const accaptableUser = await prisma.card.count({
            where: {
                room: {
                    some: {
                        ruid,
                    },
                },
            },
        });

        const requestUser = await prisma.room_Request.count({
            where: { room: { ruid } },
        });

        return resSuccess({
            res,
            title: "Succes get room information",
            data: { detailRoom, numberOfVisitor, accaptableUser, requestUser },
        });
    } catch (err) {
        return resError({ res, errors: err, code: 422 });
    }
};

/**
 * Fungsi untuk menampilkan daftar ruangan yang terpaginasi
 */
exports.list = async (req, res) => {
    const { search, cursor } = req.query;
    const id = getUser(req);
    let roomList;

    try {
        const {
            username,
            role: { name: roleName },
        } = await prisma.user.findUnique({
            where: { id },
            select: { username: true, role: { select: { name: true } } },
        });

        if (roleName === "ADMIN") {
            if (search) {
                if (!cursor) {
                    roomList = await prisma.room.findMany({
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
                        include: {
                            device: true,
                        },
                    });
                }

                if (cursor) {
                    roomList = await prisma.room.findMany({
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
                        include: {
                            device: true,
                        },
                    });
                }
            }

            if (!search) {
                if (!cursor) {
                    roomList = await prisma.room.findMany({
                        orderBy: {
                            name: "asc",
                        },
                        take: ITEM_LIMIT,
                        include: {
                            device: true,
                        },
                    });
                }
                if (cursor) {
                    roomList = await prisma.room.findMany({
                        orderBy: {
                            name: "asc",
                        },
                        take: ITEM_LIMIT,
                        skip: 1,
                        cursor: {
                            id: cursor,
                        },
                        include: {
                            device: true,
                        },
                    });
                }
            }
        }

        if (roleName === "OPERATOR") {
            if (search) {
                if (!cursor) {
                    roomList = await prisma.room.findMany({
                        where: {
                            name: {
                                contains: search,
                                mode: "insensitive",
                            },
                            Building: {
                                is: {
                                    operator: {
                                        some: {
                                            username,
                                        },
                                    },
                                },
                            },
                        },
                        orderBy: {
                            name: "asc",
                        },
                        take: ITEM_LIMIT,
                        include: {
                            device: true,
                        },
                    });
                }

                if (cursor) {
                    roomList = await prisma.room.findMany({
                        where: {
                            name: {
                                contains: search,
                                mode: "insensitive",
                            },
                            Building: {
                                is: {
                                    operator: {
                                        some: {
                                            username,
                                        },
                                    },
                                },
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
                        include: {
                            device: true,
                        },
                    });
                }
            }

            if (!search) {
                if (!cursor) {
                    roomList = await prisma.room.findMany({
                        where: {
                            Building: {
                                is: {
                                    operator: {
                                        some: {
                                            username,
                                        },
                                    },
                                },
                            },
                        },
                        orderBy: {
                            name: "asc",
                        },
                        take: ITEM_LIMIT,
                        include: {
                            device: true,
                        },
                    });
                }
                if (cursor) {
                    roomList = await prisma.room.findMany({
                        where: {
                            Building: {
                                is: {
                                    operator: {
                                        some: {
                                            username,
                                        },
                                    },
                                },
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
                        include: {
                            device: true,
                        },
                    });
                }
            }
        }

        return resSuccess({
            res,
            title: "Success listed all room",
            data: roomList,
        });
    } catch (error) {
        return resError({ res, errors: error });
    }
};

/**
 * Fungsi untuk menampilkan daftar ruangan aktif yang terpaginasi
 */
exports.activeRoomList = async (req, res) => {
    const { search, cursor } = req.query;
    const building = req.query?.building;
    let roomList;
    try {
        if (search) {
            if (!cursor) {
                roomList = await prisma.room.findMany({
                    where: {
                        name: {
                            contains: search,
                            mode: "insensitive",
                        },
                        isActive: true,
                        buildingId: building,
                    },
                    orderBy: {
                        name: "asc",
                    },
                    take: ITEM_LIMIT,
                    select: {
                        id: true,
                        name: true,
                        ruid: true,
                        device: {
                            select: {
                                id: true,
                                device_id: true,
                            },
                        },
                    },
                });
            }

            if (cursor) {
                roomList = await prisma.room.findMany({
                    where: {
                        name: {
                            contains: search,
                            mode: "insensitive",
                        },
                        isActive: true,
                        buildingId: building,
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
                        ruid: true,
                        device: {
                            select: {
                                id: true,
                                device_id: true,
                            },
                        },
                    },
                });
            }
        }

        if (!search) {
            if (!cursor) {
                roomList = await prisma.room.findMany({
                    where: {
                        isActive: true,
                        buildingId: building,
                    },
                    orderBy: {
                        name: "asc",
                    },
                    take: ITEM_LIMIT,
                    select: {
                        id: true,
                        name: true,
                        ruid: true,
                        device: {
                            select: {
                                id: true,
                                device_id: true,
                            },
                        },
                    },
                });
            }
            if (cursor) {
                roomList = await prisma.room.findMany({
                    where: {
                        isActive: true,
                        buildingId: building,
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
                        ruid: true,
                        device: {
                            select: {
                                id: true,
                                device_id: true,
                            },
                        },
                    },
                });
            }
        }

        return resSuccess({
            res,
            title: "Success listed all room",
            data: roomList,
        });
    } catch (error) {
        return resError({ res, errors: error });
    }
};

/**
 * Fungsi untuk memperbaharui informasi suatu ruangan
 */
exports.update = async (req, res) => {
    const { ruid } = req.params; // stands for room unique id
    const { roomName: name, isActive, duid, buildingId } = req.body;
    try {
        const updatedRoom = await prisma.room.update({
            where: {
                ruid: ruid,
            },
            data: {
                name,
                isActive,
                device: {
                    connect: {
                        device_id: duid,
                    },
                },
                buildingId,
            },
        });

        return resSuccess({
            res,
            title: "Succesfully update room information",
            data: updatedRoom,
        });
    } catch (err) {
        return resError({ res, errors: err });
    }
};

/**
 * Fungsi untuk menghapus ruangan tertentu
 */
exports.delete = async (req, res) => {
    console.log("DELETE ROOM");
    const ruid = req.params.ruid; // stands for room unique id
    try {
        const deletedRoom = await prisma.room.delete({
            where: {
                ruid: ruid,
            },
            select: {
                id: true,
                ruid: true,
                name: true,
                device: {
                    select: {
                        deviceType: true,
                        device_id: true,
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
                },
            },
        });

        if (deletedRoom.device.deviceType === "MULTI_NETWORK") {
            const dataToSend = {
                device_id: deletedRoom.device.device_id,
            };
            let gatewayShortId =
                deletedRoom?.device?.Gateway_Spot?.gatewayDevice
                    ?.gateway_short_id;
            if (!gatewayShortId) {
                gatewayShortId = deletedRoom?.device?.deviceLastGateway;
            }

            // INFO: BROADCAST DATA TO GATEWAY
            MQTTConnection.sendMessage(
                JSON.stringify(dataToSend),
                `resetroom/${gatewayShortId}/gateway`
            );
        }

        return resSuccess({
            res,
            data: deletedRoom,
            title: "Successfull delete the room",
        });
    } catch (err) {
        console.log("DELETE ROOM ERROR", err);
        return resError({ res, errors: err, code: 422 });
    }
};

/**
 * Fungsi untuk menautkan ruangan dengan kartu, fungsi ini akan memberi akses kepada kartu untuk mengakses ruangan tertentu
 */
exports.pairRoomToCard = async (req, res) => {
    const { ruid, cardNumber, requestId: id } = req.query;
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
            include: {
                card: {
                    where: {
                        card_number: cardNumber,
                    },
                    include: {
                        user: true,
                    },
                },
            },
        });

        await prisma.room_Request.delete({ where: { id } });

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

/**
 * Fungsi untuk menautkan seluruh request kartu terhadap ruangan
 */
exports.grantAllAccess = async (req, res) => {
    try {
        const { ruid } = req.body;
        const requestForRoom = await prisma.room_Request.findMany({
            where: {
                room: { ruid },
            },
            select: {
                card: { select: { card_number: true } },
            },
        });

        const updatedRoom = await prisma.room.update({
            where: {
                ruid,
            },
            data: {
                card: {
                    connect: [...requestForRoom.map((data) => data.card)],
                },
            },
            select: {
                card: {
                    where: {
                        card_number: {
                            in: [
                                ...requestForRoom.map(
                                    (data) => data.card.card_number
                                ),
                            ],
                        },
                    },
                    select: {
                        card_number: true,
                        pin: true,
                        isTwoStepAuth: true,
                        card_status: true,
                        banned: true,
                    },
                },
                ruid: true,
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
            },
        });

        await prisma.room_Request.deleteMany({
            where: {
                room: { ruid },
            },
        });

        // INFO: BROADCAST DATA TO GATEWAY
        if (updatedRoom.device.deviceType === "MULTI_NETWORK") {
            updatedRoom.card.forEach((card) => {
                const dataToSend = {
                    cardNumber: card.card_number,
                    cardPin: card.pin,
                    isTwoStepAuth: card.isTwoStepAuth,
                    cardStatus: card.card_status,
                    isBanned: card.banned,
                    duid: updatedRoom.device.device_id,
                    createdAt: new Date(),
                };

                MQTTConnection.sendMessage(
                    JSON.stringify(dataToSend),
                    `addcard/${updatedRoom.device.Gateway_Spot.gatewayDevice.gateway_short_id}/gateway`
                );
            });
        }

        return resSuccess({
            res,
            title: "Success grant access to all request",
            data: updatedRoom,
        });
    } catch (error) {
        return resError({
            res,
            title: "Failed to give access",
            errors: error,
        });
    }
};

/**
 * Fungsi untuk melepas akses ruangan dari kartu, fungsi ini akan memberi akses kepada kartu untuk mengakses ruangan tertentu
 */
exports.unPairRoomToCard = async (req, res) => {
    const { ruid, cardNumber, requestId: id } = req.body;
    try {
        const updatedRoom = await prisma.room.update({
            where: {
                ruid,
            },
            data: {
                card: {
                    disconnect: {
                        card_number: cardNumber,
                    },
                },
            },
            select: {
                name: true,
                card: {
                    where: {
                        card_number: cardNumber,
                    },
                    select: {
                        card_number: true,
                    },
                },
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

        const userData = await prisma.card.findUnique({
            where: {
                card_number: cardNumber,
            },
            select: {
                user: {
                    select: {
                        username: true,
                        email: true,
                    },
                },
            },
        });

        // INFO: BROADCAST DATA TO GATEWAY
        if (updatedRoom.device.deviceType === "MULTI_NETWORK") {
            const dataToSend = {
                duid: updatedRoom.device.device_id,
                cardNumber: cardNumber,
                createdAt: new Date(),
            };

            MQTTConnection.sendMessage(
                JSON.stringify(dataToSend),
                `removecard/${updatedRoom.device.Gateway_Spot.gatewayDevice.gateway_short_id}/gateway`
            );
        }

        if (FEATURE_ROOM_NOTIFICATION == "true") {
            const subject = "Room Access Permission Update";
            const template = emailDeclineOfAccessRequestsTemplate({
                username: userData.user.username,
                subject,
                text_description: `We regret to inform you that we are removing your access to ${updatedRoom.name}.`,
            });
            await sendEmail(userData.user.email, subject, template);
        }

        return resSuccess({
            res,
            title: "Success remove card access",
            data: updatedRoom,
        });
    } catch (error) {
        return resError({
            res,
            title: "Failed remove card access",
            errors: error,
        });
    }
};

/**
 * Fungsi ini akan digunakan perangkat keras. Fungsi yang berguna untuk mengecek kartu, pin dan ruangan yang akan dimasuki user,
 */
exports.roomCheckIn = async (req, res) => {
    const { ruid } = req.params;
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

        const reocrd = await prisma.rooms_Records.create({
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
        const reocrd = await prisma.rooms_Records.create({
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
        });
    }
};

/**
 * Fungsi yang bertugas untuk memasukan data ke dalam request room, user akan meminta akses ke ruangan yang diinginkan
 */
exports.roomRequest = async (req, res) => {
    try {
        const { ruid, cardNumber: card_number } = req.query;
        const request = await prisma.room_Request.create({
            data: {
                room: {
                    connect: {
                        ruid,
                    },
                },
                card: {
                    connect: {
                        card_number,
                    },
                },
            },
        });
        return resSuccess({
            res,
            title: "Success request room access",
            data: request,
        });
    } catch (error) {
        return resError({
            res,
            title: "Failed request room",
            errors: error,
        });
    }
};

/**
 * Fungsi untuk menghapus request user ke dalam suatu ruangan
 */
exports.declineRoomRequest = async (req, res) => {
    try {
        const { requestId } = req.query;
        const deletedRequest = await prisma.room_Request.delete({
            where: { id: requestId },
            select: {
                card: {
                    select: {
                        card_number: true,
                        user: {
                            select: {
                                username: true,
                                email: true,
                            },
                        },
                    },
                },
                room: {
                    select: {
                        name: true,
                    },
                },
            },
        });

        const subject = "Decline of Access Requests";
        const template = emailDeclineOfAccessRequestsTemplate({
            username: deletedRequest.card.user.username,
            subject,
            text_description: `We regret to inform you that your request for access to ${deletedRequest.room.name} has been denied.`,
        });
        await sendEmail(deletedRequest.card.user.email, subject, template);
        return resSuccess({
            res,
            title: "Success delete request room",
            data: deletedRequest,
        });
    } catch (error) {
        return resError({
            res,
            title: "Failed to delete request",
            errors: error,
        });
    }
};

/**
 * Fungsi yang akan menampilkan data ruangan yang bisa diakses oleh user, fungsi ini sudah terpaginasi
 */
exports.userAccessableRoom = async (req, res) => {
    const { search, cursor } = req.query;
    const { cardNumber: card_number } = req.params;
    let roomList;
    try {
        if (search) {
            if (!cursor) {
                roomList = await prisma.room.findMany({
                    where: {
                        name: {
                            contains: search,
                            mode: "insensitive",
                        },
                        card: {
                            some: {
                                card_number,
                            },
                        },
                    },
                    orderBy: {
                        name: "asc",
                    },
                    take: ITEM_LIMIT,
                });
            }

            if (cursor) {
                roomList = await prisma.room.findMany({
                    where: {
                        name: {
                            contains: search,
                            mode: "insensitive",
                        },
                        card: {
                            some: {
                                card_number,
                            },
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
                });
            }
        }

        if (!search) {
            if (!cursor) {
                roomList = await prisma.room.findMany({
                    where: {
                        card: {
                            some: {
                                card_number,
                            },
                        },
                    },
                    select: {
                        id: true,
                        name: true,
                        ruid: true,
                    },
                    orderBy: {
                        name: "asc",
                    },
                    take: ITEM_LIMIT,
                });
            }
            if (cursor) {
                roomList = await prisma.room.findMany({
                    where: {
                        card: {
                            some: {
                                card_number,
                            },
                        },
                    },
                    select: {
                        id: true,
                        name: true,
                        ruid: true,
                    },
                    orderBy: {
                        name: "asc",
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
            title: "Success listed all room",
            data: roomList,
        });
    } catch (error) {
        return resError({ res, errors: error });
    }
};

/** Fungsi yang akan menampilkan daftar user yang memiliki akses ke suatu ruangan */
exports.accaptableUser = async (req, res) => {
    const { ruid } = req.params;
    const { cursor } = req.query;
    let accaptableUser;
    try {
        if (!cursor) {
            accaptableUser = await prisma.card.findMany({
                where: {
                    room: {
                        some: {
                            ruid,
                        },
                    },
                },
                orderBy: {
                    updatedAt: "desc",
                },
                take: ITEM_LIMIT,
                include: {
                    user: true,
                },
            });
        }

        if (cursor) {
            accaptableUser = await prisma.card.findMany({
                where: {
                    room: {
                        some: {
                            ruid,
                        },
                    },
                },
                orderBy: {
                    updatedAt: "desc",
                },
                take: ITEM_LIMIT,
                skip: 1,
                cursor: {
                    id: cursor,
                },
                include: {
                    user: true,
                },
            });
        }
        return resSuccess({
            res,
            title: "Succes listed accaptable user",
            data: accaptableUser,
        });
    } catch (error) {
        return resError({
            res,
            title: "Gagal memuat user yang diizinkan",
            errors: error,
        });
    }
};

/** Fungsi yang akan menampilkan daftar user yang meminta akses ke suatu ruangan */
exports.requestRoomByUser = async (req, res) => {
    const { ruid } = req.params;
    const { cursor } = req.query;
    let requestUser;
    try {
        if (!cursor) {
            requestUser = await prisma.room_Request.findMany({
                where: {
                    room: {
                        is: {
                            ruid,
                        },
                    },
                },
                orderBy: {
                    createdAt: "asc",
                },
                include: {
                    card: {
                        include: {
                            user: {
                                select: {
                                    username: true,
                                },
                            },
                        },
                    },
                },
                take: ITEM_LIMIT,
            });
        }

        if (cursor) {
            requestUser = await prisma.room_Request.findMany({
                where: {
                    room: {
                        is: {
                            ruid,
                        },
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
                include: {
                    card: {
                        include: {
                            user: {
                                select: {
                                    username: true,
                                },
                            },
                        },
                    },
                },
            });
        }
        // requestUser = await prisma.room_Request.findMany({
        //     where: {
        //         room: {
        //             is: {
        //                 ruid,
        //             },
        //         },
        //     },
        //     include: {
        //         card: {
        //             include: {
        //                 user: {
        //                     select: {
        //                         username: true,
        //                     },
        //                 },
        //             },
        //         },
        //     },
        // });
        return resSuccess({
            res,
            title: "Success listed request user",
            data: requestUser,
        });
    } catch (error) {
        return resError({
            res,
            title: "Gagal memuat user yang mimnta request",
            errors: error,
        });
    }
};

/** Fungsi untuk menampilkan informasi (log) ruangan*/
exports.logs = async (req, res) => {
    // INFO: This function need update to have search functionality
    const { ruid } = req.params;
    const { cursor } = req.query;
    let room;
    try {
        if (!cursor) {
            room = await prisma.rooms_Records.findMany({
                where: {
                    room: {
                        ruid,
                    },
                },
                orderBy: {
                    createdAt: "desc",
                },
                include: {
                    Card: {
                        include: {
                            user: true,
                        },
                    },
                },
                take: ITEM_LIMIT,
            });
        }

        if (cursor) {
            room = await prisma.rooms_Records.findMany({
                where: {
                    room: {
                        ruid,
                    },
                },
                orderBy: {
                    createdAt: "desc",
                },
                take: ITEM_LIMIT,
                skip: 1,
                cursor: {
                    id: cursor,
                },
                include: {
                    Card: {
                        include: {
                            user: true,
                        },
                    },
                },
            });
        }
        return resSuccess({
            res,
            title: "Success listed room logs",
            data: room,
        });
    } catch (error) {
        return resError({
            res,
            title: "Gagal memuat user yang mimnta request",
            errors: error,
        });
    }
};

/** Fungsi untuk validasi pin pintu */
exports.validatePin = async (req, res) => {
    const { ruid } = req.params;
    const { pin } = req.body;
    try {
        const { pin: hashPin } = await prisma.room.findUnique({
            where: { ruid },
        });

        const validate = hashChecker(pin, hashPin);
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

/** Fungsi untuk menampilkan daftar ruangan untuk keperluan autocomplate */
exports.autocomplate = async (req, res) => {
    try {
        const search = req.query.term;
        const results = [];
        const searchResult = await prisma.room.findMany({
            where: {
                name: {
                    contains: search,
                    mode: "insensitive",
                },
            },
            select: {
                name: true,
                ruid: true,
            },
            take: ITEM_LIMIT,
        });

        searchResult.forEach((data) => {
            const { name, ruid } = data;
            results.push({ value: ruid, label: name });
        });

        return res.status(200).json(results);
    } catch (error) {
        return resError({
            res,
            title: "Cant get room information",
            errors: error,
        });
    }
};

/** Fungsi Untuk Menampilkan Daftar Ruangan Yang Bisa Diakses user */
exports.usernameAccessableRoom = async (req, res) => {
    try {
        const { cursor } = req.query;
        const username = req.query?.username;
        const card_number = req.query?.cardNumber;
        let roomList;
        if (username) {
            if (!cursor) {
                roomList = await prisma.room.findMany({
                    where: {
                        card: {
                            some: {
                                user: {
                                    username,
                                },
                            },
                        },
                    },
                    select: {
                        id: true,
                        name: true,
                        ruid: true,
                        card: {
                            where: {
                                user: {
                                    username,
                                },
                            },
                            select: {
                                card_number: true,
                            },
                        },
                    },
                    orderBy: {
                        name: "asc",
                    },
                    take: ITEM_LIMIT,
                });
            }

            if (cursor) {
                roomList = await prisma.room.findMany({
                    where: {
                        card: {
                            some: {
                                user: {
                                    username,
                                },
                            },
                        },
                    },
                    select: {
                        id: true,
                        name: true,
                        ruid: true,
                        card: {
                            where: {
                                user: {
                                    username,
                                },
                            },
                            select: {
                                card_number: true,
                            },
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
                });
            }
        }

        if (card_number) {
            if (!cursor) {
                roomList = await prisma.room.findMany({
                    where: {
                        card: {
                            some: {
                                card_number,
                            },
                        },
                    },
                    select: {
                        id: true,
                        name: true,
                        ruid: true,
                        card: {
                            where: {
                                card_number,
                            },
                            select: {
                                card_number: true,
                            },
                        },
                    },
                    orderBy: {
                        name: "asc",
                    },
                    take: ITEM_LIMIT,
                });
            }

            if (cursor) {
                roomList = await prisma.room.findMany({
                    where: {
                        card: {
                            some: {
                                card_number,
                            },
                        },
                    },
                    select: {
                        id: true,
                        name: true,
                        ruid: true,
                        card: {
                            where: {
                                card_number,
                            },
                            select: {
                                card_number: true,
                            },
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
                });
            }
        }
        return resSuccess({
            res,
            title: "Success get user accessable room",
            data: roomList,
        });
    } catch (error) {
        return resError({
            res,
            title: "Cant get user accessable room information",
            errors: error,
        });
    }
};

const prisma = require("../../prisma/client");
const { resSuccess, resError } = require("../../services/responseHandler");
const { random: stringGenerator } = require("@supercharge/strings");
const { hasher, hashChecker } = require("../../services/auth");
const { MQTTConnection } = require("../../connection/mqtt");
const ITEM_LIMIT = Number(process.env.CARD_ITEM_LIMIT) || 10;
// const ITEM_LIMIT = 5;

exports.createGatewayDevice = async (req, res) => {
    try {
        let gatewayShortId = stringGenerator(5);
        let generateID = true;
        const PIN = process.env.DEFAULT_HW_PIN;

        while (generateID) {
            const gatewayShortIdIsEmpty =
                await prisma.gateway_Device.findUnique({
                    where: {
                        gateway_short_id: gatewayShortId,
                    },
                });

            if (!gatewayShortIdIsEmpty) {
                generateID = false;
                break;
            }

            gatewayShortId = stringGenerator(5);
        }
        const gatewayDeviceData = await prisma.gateway_Device.create({
            data: {
                gateway_short_id: gatewayShortId,
                lastOnline: new Date(),
                pin: hasher(PIN),
            },
            select: {
                gateway_short_id: true,
            },
        });

        return resSuccess({
            res,
            title: "Success initialize hardwaresss",
            data: gatewayDeviceData,
        });
    } catch (error) {
        return resError({
            res,
            title: "Failed to initialize device",
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
                gatewayList = await prisma.gateway_Device.findMany({
                    where: {
                        gateway_short_id: {
                            contains: search,
                            mode: "insensitive",
                        },
                    },
                    orderBy: {
                        gateway_short_id: "asc",
                    },
                    take: ITEM_LIMIT,
                    select: {
                        id: true,
                        gateway_short_id: true,
                        lastOnline: true,
                        createdAt: true,
                    },
                });
            }

            if (cursor) {
                gatewayList = await prisma.gateway_Device.findMany({
                    where: {
                        gateway_short_id: {
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
                        gateway_short_id: "asc",
                    },
                    select: {
                        id: true,
                        gateway_short_id: true,
                        lastOnline: true,
                        createdAt: true,
                    },
                });
            }
        }

        if (!search) {
            if (!cursor) {
                gatewayList = await prisma.gateway_Device.findMany({
                    orderBy: {
                        gateway_short_id: "asc",
                    },
                    take: ITEM_LIMIT,
                    select: {
                        id: true,
                        gateway_short_id: true,
                        lastOnline: true,
                        createdAt: true,
                    },
                });
            }
            if (cursor) {
                gatewayList = await prisma.gateway_Device.findMany({
                    orderBy: {
                        gateway_short_id: "asc",
                    },
                    take: ITEM_LIMIT,
                    skip: 1,
                    cursor: {
                        id: cursor,
                    },
                    select: {
                        id: true,
                        gateway_short_id: true,
                        lastOnline: true,
                        createdAt: true,
                    },
                });
            }
        }

        return resSuccess({
            res,
            title: "Success get gateway device list",
            data: gatewayList,
        });
    } catch (error) {
        return resError({
            res,
            title: "Failed to get gateway device list",
            errors: error,
        });
    }
};

exports.generalInformation = async (req, res) => {
    try {
        const countOfGateway = await prisma.gateway_Device.count();
        const countOfNodwWithMultiNetworkType = await prisma.device.count({
            where: { deviceType: "MULTI_NETWORK" },
        });
        const gatewayList = await prisma.gateway_Device.findMany({
            orderBy: {
                gateway_short_id: "asc",
            },
            take: ITEM_LIMIT,
            select: {
                id: true,
                gateway_short_id: true,
                lastOnline: true,
                createdAt: true,
            },
        });
        return resSuccess({
            res,
            title: "Success get gateway device general information",
            data: {
                countOfGateway,
                countOfNodwWithMultiNetworkType,
                gatewayList,
            },
        });
    } catch (error) {
        return resError({
            res,
            title: "Failed to get gateway detail information",
            errors: error,
        });
    }
};

exports.detail = async (req, res) => {
    try {
        const { gatewayShortId } = req.params;
        const data = await prisma.gateway_Device.findUnique({
            where: {
                gateway_short_id: gatewayShortId,
            },
        });
        return resSuccess({
            res,
            title: "Success get gateway device detail information",
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

exports.updateOnline = async (req, res) => {
    try {
        const { gatewayShortId } = req.params;
        const { lastOnline, gateway_short_id } =
            await prisma.gateway_Device.update({
                where: {
                    gateway_short_id: gatewayShortId,
                },
                data: {
                    lastOnline: new Date(),
                },
                select: {
                    lastOnline: true,
                    gateway_short_id: true,
                },
            });
        return resSuccess({
            res,
            title: "Success update last online",
            data: { lastOnline, gatewayShortId },
        });
    } catch (error) {
        return resError({
            res,
            title: "Failed to get gateway detail information",
            errors: error,
        });
    }
};

exports.autocomplate = async (req, res) => {
    try {
        const search = req.query.term;
        const results = [];
        const searchResult = await prisma.gateway_Device.findMany({
            where: {
                gateway_short_id: {
                    contains: search,
                    mode: "insensitive",
                },
            },
            select: {
                id: true,
                gateway_short_id: true,
            },
            take: ITEM_LIMIT,
        });

        searchResult.forEach((data) => {
            const { gateway_short_id, id } = data;
            results.push({ value: id, label: gateway_short_id });
        });

        return res.status(200).json(results);
    } catch (error) {
        return resError({
            res,
            title: "Cant get gateway device information",
            errors: error,
        });
    }
};

exports.accessCardForGateway = async (req, res) => {
    try {
        const { gatewayShortId } = req.params;
        const rooms = await prisma.gateway_Spot.findMany({
            where: {
                gatewayDevice: {
                    gateway_short_id: gatewayShortId,
                },
            },
            select: {
                nodeDevice: {
                    select: {
                        device_id: true,
                        room: {
                            select: {
                                ruid: true,
                            },
                        },
                    },
                },
            },
        });

        const ruidArray = rooms[0].nodeDevice
            .map((room) => room.room?.ruid)
            .filter((ruid) => ruid != undefined);

        const accessCard = await prisma.card.findMany({
            where: {
                room: {
                    some: {
                        ruid: { in: ruidArray },
                    },
                },
            },
            select: {
                id: true,
                card_number: true,
                pin: true,
                isTwoStepAuth: true,
                banned: true,
                card_status: true,
                room: {
                    where: {
                        ruid: {
                            in: ruidArray,
                        },
                    },
                    select: {
                        device: {
                            select: {
                                device_id: true,
                            },
                        },
                    },
                },
            },
        });

        return resSuccess({
            res,
            title: "Success get Access Card For Gateway",
            data: accessCard,
        });
    } catch (error) {
        return resError({
            res,
            title: "Cant get Access Card For This Gateway",
            errors: error,
        });
    }
};

exports.gatewayInitializeNode = async (req, res) => {
    try {
        const { gatewayShortId } = req.body;
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

        const { id: gateway_DeviceId, gateway_short_id } =
            await prisma.gateway_Device.findUnique({
                where: { gateway_short_id: gatewayShortId },
                select: {
                    id: true,
                    gateway_short_id: true,
                },
            });
        const newDevice = await prisma.device.create({
            data: {
                device_id: duid,
                lastOnline: new Date(),
                deviceType: "MULTI_NETWORK",
                deviceLastGateway: gateway_short_id,
                Gateway_Spot: {
                    connect: {
                        gateway_DeviceId,
                    },
                },
            },
        });
        return resSuccess({
            res,
            title: "Success create new node",
            data: newDevice,
        });
    } catch (error) {
        return resError({
            res,
            title: "Cant create gateway node",
            errors: error,
        });
    }
};

exports.deleteGateway = async (req, res) => {
    try {
        const { gatewayShortId } = req.body;
        const deleteGateway = await prisma.gateway_Device.delete({
            where: {
                gateway_short_id: gatewayShortId,
            },
            select: {
                gateway_short_id: true,
                id: true,
            },
        });
        return resSuccess({
            req,
            res,
            data: deleteGateway,
            title: "Success delete gateway device",
        });
    } catch (error) {
        return resError({
            res,
            title: "Cant delete gateway device",
            errors: error,
        });
    }
};

/**
 * Fungsi untuk melakukan update kapan terkahir kalinya perangkat dalam kondisi online
 */
exports.gatewayNodeOnlineUpdate = async (req, res) => {
    const { duid, lastOnline } = req.body; // stands for room unique id
    const responsesTime = req.body?.responsesTime;
    try {
        const detailRoom = await prisma.device.update({
            where: { device_id: duid },
            data: {
                lastOnline:
                    lastOnline != null
                        ? new Date(
                              new Date(lastOnline).setHours(
                                  new Date(lastOnline).getHours() - 7
                              )
                          )
                        : null,
            },
        });

        if (responsesTime !== undefined) {
            const dataToSend = {
                duid,
                deviceType: detailRoom.deviceType,
                responsesTime: responsesTime.split(",").slice(0, -1),
            };

            MQTTConnection.publish(
                "logger.save",
                dataToSend
            );
        }

        return resSuccess({
            res,
            title: "Succes update node last online information",
            data: detailRoom,
        });
    } catch (err) {
        console.log(err);
        return resError({ res, errors: err, code: 422 });
    }
};

/**
 * Fungsi untuk mendaftarkan kartu melalui gateway
 */
exports.registerCard = async (req, res) => {
    try {
        const { cardNumber, pin, username } = req.body;

        // Register card to db
        let registeredCard = await prisma.card.create({
            data: {
                card_number: cardNumber.replaceAll(" ", ""),
                isTwoStepAuth: false,
            },
        });
        req.app.io.emit("newRegisteredCard", cardNumber);

        if (String(pin).length == 6) {
            // Update card to use two step auth
            registeredCard = await prisma.card.update({
                where: {
                    card_number: cardNumber,
                },
                data: {
                    pin: hasher(pin),
                    isTwoStepAuth: true,
                },
            });
        }

        if (String(username).length > 0) {
            // check the user exist
            await prisma.user.findFirstOrThrow({
                where: {
                    username,
                },
            });

            // update card and pair with a user
            registeredCard = await prisma.card.update({
                where: {
                    card_number: cardNumber,
                },
                data: {
                    user: {
                        connect: {
                            username,
                        },
                    },
                    card_status: "REGISTER",
                },
            });
        }

        return resSuccess({
            res,
            title: "Success register new card",
            data: registeredCard,
        });
    } catch (error) {
        let cardAlreadyRegisterError;
        let userNotFoundError;
        if (error?.meta?.target && error?.meta?.target[0] == "card_number") {
            cardAlreadyRegisterError = "Card Already Exist";
        }
        if (error?.name == "NotFoundError") {
            userNotFoundError = "User not exist";
        }
        return resError({
            res,
            errors: cardAlreadyRegisterError || userNotFoundError || error,
            code: 422,
            title: "Failed to register new card",
        });
    }
};

/**
 * Fungsi untuk login melalui gateway, fungsi ini digunakan pada hardware tujuannya adalah mengautentikasi pengguna yang tepat
 */
exports.login = async (req, res) => {
    const { username, password } = req.body;

    try {
        // try find the user
        const user = await prisma.user.findUnique({
            where: {
                username,
            },
            select: {
                id: true,
                username: true,
                password: true,
                email: true,
                role: {
                    select: {
                        name: true,
                    },
                },
            },
        });

        // give response if cant find the user
        if (user === null) throw "Cant find the user";

        // compare user and password
        const auth = hashChecker(password, user.password);

        // give response if password not match
        if (!auth) throw "Username and Password didn't match";

        // If user role is USER, they cant continuou the action
        if (user.role.name === "USER") throw "User cant performe this action";

        return resSuccess({
            res,
            title: "Success login to system",
            data: {
                username: user.username,
                email: user.email,
            },
        });
    } catch (err) {
        return resError({ res, title: "Gagal Login", errors: err, code: 401 });
    }
};

/**
 * Fungsi untuk melakukan pencatatan sipa yang mengakses node / mengunjungi suatu ruangan
 */
exports.history = async (req, res) => {
    try {
        const { cardNumber, duid, isSuccess, time } = req.body;
        const {
            room: { ruid },
        } = await prisma.device.findUnique({
            where: { device_id: duid },
            select: { room: true },
        });
        let data = "";

        const card = await prisma.card.findUnique({
            where: {
                card_number: cardNumber.replaceAll(" ", ""),
            },
        });

        if (card) {
            data = await prisma.rooms_Records.create({
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
                    isSuccess,
                    createdAt:
                        time != null ? new Date(time) : new Date(Date.now()),
                    updatedAt:
                        time != null ? new Date(time) : new Date(Date.now()),
                },
            });
        }

        if (!card) {
            data = await prisma.rooms_Records.create({
                data: {
                    unregisteredCard: cardNumber,
                    isSuccess,
                    createdAt:
                        time != null ? new Date(time) : new Date(Date.now()),
                    updatedAt:
                        time != null ? new Date(time) : new Date(Date.now()),
                },
            });
        }

        return resSuccess({
            res,
            title: "Success save node history",
            data: data,
        });
    } catch (error) {
        console.log(error);
        return resError({
            res,
            errors: error,
            code: 422,
            title: "Failed to create new history record",
        });
    }
};

/**
 * Fungsi untuk melakukan pencatatan sipa yang mengakses node / mengunjungi suatu ruangan, pencatatan ini dilakukan untuk data yang banyak. Kasus ini bisa terjadi ketika katika gateway masuk dalam kondisi offline dan baru akan mengirimkan data ketika kembali terhubung ke jaringan
 */
exports.bulkCreateHistory = async (req, res) => {
    try {
        const { historys } = req.body;
        for (const history in historys) {
            const { cardNumber, duid, isSuccess, time } = historys[history];

            const {
                room: { ruid },
            } = await prisma.device.findUnique({
                where: { device_id: duid },
                select: { room: true },
            });

            const card = await prisma.card.findUnique({
                where: {
                    card_number: cardNumber.replaceAll(" ", ""),
                },
            });

            if (!card) {
                data = await prisma.rooms_Records.create({
                    data: {
                        unregisteredCard: cardNumber,
                        isSuccess,
                        createdAt:
                            time != null
                                ? new Date(time)
                                : new Date(Date.now()),
                        updatedAt:
                            time != null
                                ? new Date(time)
                                : new Date(Date.now()),
                    },
                });
            }

            if (card) {
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
                        isSuccess,
                        createdAt:
                            time != null
                                ? new Date(
                                      new Date(time).setHours(
                                          new Date(time).getHours() - 7
                                      )
                                  )
                                : null,

                        updatedAt:
                            time != null
                                ? new Date(
                                      new Date(time).setHours(
                                          new Date(time).getHours() - 7
                                      )
                                  )
                                : null,
                    },
                });
            }
        }
        return resSuccess({
            res,
            title: "Success create bulk history",
        });
    } catch (error) {
        console.log(error);
        return resError({
            res,
            errors: error,
            code: 422,
            title: "Failed to create new history record",
        });
    }
};

const prisma = require('../../prisma/client');
const { getUser, hasher } = require('../../services/auth');
const { resSuccess, resError } = require("../../services/responseHandler");
const { MQTTConnection } = require("../../connection/mqtt");

exports.registerPin = async (req, res) => {
    const { pin, ruid } = req.body;
    const userId = getUser(req);
    try {
        const room = await prisma.room.findUnique({
            where: { ruid },
            select: { id: true, name: true, ruid: true }
        });
        if (!room) {
            return resError({
                res,
                title: "Room not found",
                statusCode: 404,
                errors: { ruid: `Room with ruid "${ruid}" does not exist` }
            });
        }
        const existingPin = await prisma.pinCredential.findFirst({
            where: { 
                userId, 
                roomId: room.id
            }
        });
        if (existingPin) {
            return resError({ 
                res, 
                title: "PIN already registered for this room",
                statusCode: 409,
                errors: { message: "User already has a PIN for this room. Please update instead." }
            });
        }
        const newPinCredential = await prisma.pinCredential.create({
            data: {
                userId,
                roomId: room.id,
                pinHash: hasher(pin),
                isActive: true
            },
            include: {
                user: { 
                    select: { 
                        username: true,
                        profil: { select: { full_name: true } }
                    } 
                },
                room: { 
                    select: { 
                        name: true, 
                        ruid: true 
                    } 
                }
            }
        });
        return resSuccess({
            res,
            title: "Successfully registered standalone PIN",
            data: {
                id: newPinCredential.id,
                pin: newPinCredential.pinHash,
                userId: newPinCredential.userId,
                username: newPinCredential.user.username,
                fullName: newPinCredential.user.profil?.full_name,
                roomId: newPinCredential.roomId,
                roomRuid: newPinCredential.room.ruid,
                roomName: newPinCredential.room.name,
                isActive: newPinCredential.isActive,
                createdAt: newPinCredential.createdAt
            }
        });
    } catch (error) {
        console.error(error);

        return resError({
            res,
            title: "Error registering pin",
            errors: error.message || error
        });
    }
};
exports.updatePin = async (req, res) => {
    const { pinId } = req.params;
    const { newPin } = req.body;
    const userId = getUser(req);

    try {
        const existingPin = await prisma.pinCredential.findFirst({
            where: { id: pinId, userId: userId },
            include: { room: { select: { ruid: true, name: true, id: true } } }
        });

        if (!existingPin) {
            return resError({
                res,
                title: "PIN not found or you don't have permission to update it",
                statusCode: 404
            });
        }

        // 1. Update di Database
        const updatedPin = await prisma.pinCredential.update({
            where: { id: pinId },
            data: { pinHash: hasher(newPin) }
        });

        // 2. Cari Device yang terhubung dengan Room ini
        const device = await prisma.device.findFirst({
            where: { roomId: existingPin.room.id },
            select: { device_id: true }
        });

        // 3. Kirim Perintah ke ESP32 agar update memori lokalnya
        if (device && device.device_id) {
            const payload = {
                action: "update_user_pin",
                newPin: newPin, // Kirim PIN baru dalam bentuk plain text agar ESP32 bisa simpan
                roomRuid: existingPin.room.ruid
            };
            
            MQTTConnection.publish(
                `doorlock/${device.device_id}/command`, // <-- Pakai topik command
                payload // <-- Pakai topik command
            );
            console.log(`[MQTT] Sent PIN update command to ${device.device_id}`);
        }

        return resSuccess({
            res,
            title: "Successfully updated PIN",
            data: {
                id: updatedPin.id,
                roomRuid: existingPin.room.ruid,
                roomName: existingPin.room.name,
                isActive: updatedPin.isActive,
                updatedAt: updatedPin.updatedAt
            }
        });
    } catch (error) {
        console.error(error);
        return resError({ res, title: "Failed to update PIN", errors: error.message || error });
    }
};
exports.listUserPins = async (req, res) => {
    const userId = getUser(req);
    try {
        const pins = await prisma.pinCredential.findMany({
            where: { userId },
            select: {
                id: true,
                isActive: true,
                expiresAt: true,
                room: {
                    select: {
                        ruid: true,
                        name: true
                    }
                },
                createdAt: true
            },
            orderBy: { createdAt: 'desc' }
        });
        const formattedPins = pins.map(pin => ({
            id: pin.id,
            roomRuid: pin.room.ruid,
            roomName: pin.room.name,
            isActive: pin.isActive,
            expiresAt: pin.expiresAt,
            createdAt: pin.createdAt
        }));
        return resSuccess({
            res,
            title: "Successfully retrieved user PINs",
            data: formattedPins
        });
    } catch (error) {
        return resError({
            res,
            title: "Failed to retrieve PINs",
            errors: error.message || error
        });
    }
};
exports.deletePin = async (req, res) => {
    const { pinId } = req.params;
    const userId = getUser(req);

    try {
        const existingPin = await prisma.pinCredential.findFirst({
            where: { id: pinId, userId: userId },
            include: { room: { select: { ruid: true, id: true } } }
        });

        if (!existingPin) {
            return resError({
                res,
                title: "PIN not found or you don't have permission to delete it",
                statusCode: 404
            });
        }

        // 1. Hapus dari Database
        await prisma.pinCredential.delete({ where: { id: pinId } });

        // 2. Cari Device yang terhubung dengan Room ini
        const device = await prisma.device.findFirst({
            where: { roomId: existingPin.room.id },
            select: { device_id: true }
        });

        // 3. Kirim Perintah ke ESP32 agar menghapus/mengosongkan PIN lokal
        if (device && device.device_id) {
            const payload = {
                action: "delete_user_pin",
                roomRuid: existingPin.room.ruid
            };
            
            MQTTConnection.publish(
                `doorlock/${device.device_id}/command`, // <-- Pakai topik command
                payload
            );
            console.log(`[MQTT] Sent PIN delete command to ${device.device_id}`);
        }

        return resSuccess({ res, title: "Successfully deleted PIN" });
    } catch (error) {
        return resError({ res, title: "Failed to delete PIN", errors: error.message || error });
    }
};
// exports.verifyPinHardware = async (req, res) => {
//     const { pin, deviceId } = req.body;

//     try {
//         // Cari room berdasarkan device
//         const device = await prisma.device.findUnique({
//             where: { device_id: deviceId },
//             select: { 
//                 roomId: true, 
//                 deviceType: true,
//                 Gateway_Spot: { 
//                     select: { 
//                         gatewayDevice: { 
//                             select: { gateway_short_id: true } 
//                         } 
//                     } 
//                 }
//             }
//         });

//         if (!device || !device.roomId) {
//             return resError({ 
//                 res, 
//                 title: "Device not found or not assigned to any room", 
//                 statusCode: 404 
//             });
//         }

//         // Hash PIN untuk comparison
//         const inputPinHash = hasher(pin);

//         // Cari credential yang cocok
//         const credential = await prisma.pinCredential.findFirst({
//             where: {
//                 pinHash: inputPinHash,
//                 roomId: device.roomId,
//                 isActive: true
//             },
//             include: {
//                 user: {
//                     select: {
//                         username: true,
//                         profil: { select: { full_name: true, photo: true } }
//                     }
//                 },
//                 room: { 
//                     select: { 
//                         name: true,
//                         ruid: true 
//                     } 
//                 }
//             }
//         });

//         // Log aktivitas
//         await prisma.rooms_Records.create({
//             data: {
//                 roomId: device.roomId,
//                 cardId: null,
//                 unregisteredCard: null,
//                 isSuccess: !!credential
//             }
//         });

//         if (!credential) {
//             return resError({ 
//                 res, 
//                 title: "Access Denied: Invalid PIN or no access to this room", 
//                 statusCode: 403 
//             });
//         }

//         // Broadcast ke gateway (jika multi-network)
//         if (device.deviceType === "MULTI_NETWORK" && device.Gateway_Spot?.gatewayDevice?.gateway_short_id) {
//             const payload = {
//                 action: "UNLOCK_GRANTED",
//                 reason: "STANDALONE_PIN",
//                 userName: credential.user.profil?.full_name || credential.user.username,
//                 roomRuid: credential.room.ruid,
//                 timestamp: new Date().toISOString()
//             };
            
//             MQTTConnection.publish(
//                 `access_granted/${device.Gateway_Spot.gatewayDevice.gateway_short_id}/gateway`,
//                 payload
//             );
//         }

//         return resSuccess({
//             res,
//             title: "Access Granted",
//             data: {
//                 userName: credential.user.profil?.full_name || credential.user.username,
//                 roomName: credential.room.name,
//                 roomRuid: credential.room.ruid,
//                 action: "UNLOCK"
//             }
//         });

//     } catch (error) {
//         console.error("=== HARDWARE VERIFICATION ERROR ===");
//         console.error(error);
        
//         return resError({
//             res,
//             title: "Hardware verification failed",
//             errors: error.message || error
//         });
//     }
// }; 
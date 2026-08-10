const prisma = require("./client");
const { user, role, rooms } = require("./superAdmin");
const { random: stringGenerator } = require("@supercharge/strings");

async function main() {
    const secret = process.env.SEED_API_KEY;
    const id = process.env.SEED_API_ID;
    const key = await prisma.api_Key.create({ data: { id, secret } });

    for (let room of rooms) {
        const { name } = room;
        let duid = "Hge40";
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
            },
        });

        let ruid = "yuiOB";
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
            },
        });
    }

    for (let r of role) {
        const { name } = r;
        await prisma.role.create({
            data: {
                name,
            },
        });
    }

    for (let u of user) {
        const { username, email, password, role } = u;
        await prisma.user.create({
            data: {
                role: {
                    connect: {
                        name: role,
                    },
                },
                username,
                email,
                password,
                profil: {
                    create: {
                        full_name: username,
                    },
                },
            },
        });
    }
}

main()
    .catch((e) => {
        console.error("❌ GAGAL SEEDING. ERROR DETAIL:",e);
        process.exit(1);
    })
    .finally(() => {
        prisma.$disconnect();
    });

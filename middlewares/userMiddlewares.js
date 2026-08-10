const prisma = require("../prisma/client");
const { resError } = require("../services/responseHandler");

const userIsExist = async (req, res, next) => {
    const uuid = req.params.id;
    try {
        const user = await prisma.user.findUnique({
            where: {
                id: uuid,
            },
        });

        if (!user) throw "Can't find the user";
        next();
    } catch (error) {
        return resError({ res, title: error });
    }
};

const usernameIsExist = async (req, res, next) => {
    const username = req.body.username;
    try {
        const user = await prisma.user.findUnique({
            where: {
                username,
            },
            include: { role: true },
        });

        if (!user) throw "Can't find the username";
        if (user.role.name !== "USER") throw "Can't pair card to user";
        next();
    } catch (error) {
        return resError({ res, title: error });
    }
};

module.exports = { userIsExist, usernameIsExist };

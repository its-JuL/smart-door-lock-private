const prisma = require("../prisma/client");
const layoutHandler = async (id) => {
    const userData = await prisma.user.findUnique({
        where: { id },
        include: { role: true },
    });

    const layout =
        userData.role.name === "ADMIN"
            ? "base"
            : userData.role.name === "OPERATOR"
            ? "operatorBase"
            : userData.role.name === "ADMIN TEKNIS"
            ? "adminteknisBase"
            : "userBase";
    return layout;
};

module.exports = { layoutHandler };

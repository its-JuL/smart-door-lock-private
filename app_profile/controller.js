const prisma = require("../prisma/client");
const { getUser } = require("../services/auth");
const { layoutHandler } = require("../services/layout");

exports.profile = async (req, res) => {
    const id = getUser(req);
    const userData = await prisma.user.findUnique({
        where: { id },
        include: { profil: true, role: true },
    });
    const data = {
        styles: ["/style/profil.css"],
        scripts: ["/js/profil.js"],
        userData,
        user_active: "bg-neutral-4",
        avatar: userData.profil.photo || "/image/illustration-user.png",
        layout: await layoutHandler(getUser(req)),
    };
    res.render("profile", data);
};

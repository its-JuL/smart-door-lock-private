require("dotenv").config;
const jwt = require("jsonwebtoken");
const { resError } = require("../services/responseHandler");
const { getJwtToken, getUser, setCookie } = require("../services/auth");
const prisma = require("../prisma/client");

const loginRequired = (req, res, next) => {
    try {
        const jwtToken = getJwtToken(req);

        // check if token exits
        if (!jwtToken) throw "JWT missing, login required";

        jwt.verify(jwtToken, process.env.SECRET, async (err, decode) => {
            try {
                if (!err) {
                    // find user
                    const user = await prisma.user.findUnique({
                        where: {
                            id: decode.id,
                        },
                        select: {
                            id: true,
                            username: true,
                            passwordUpdatedAt: true,
                        },
                    });

                    if (
                        new Date(Number(decode.iat * 1000)) <
                        new Date(user.passwordUpdatedAt)
                    ) {
                        throw "Some information change, re-login required";
                    }

                    if (!user) throw "Can't find the user, login required";

                    if (user) return next();
                } else {
                    throw "Token not valid, login required";
                }
            } catch (error) {
                res.cookie("jwt", "", { maxAge: 1 });
                return res.redirect("/auth/login");
            }
        });
    } catch (error) {
        res.cookie("jwt", "", { maxAge: 1 });
        return res.redirect("/auth/login");
    }
};

const logoutRequired = (req, res, next) => {
    const jwtToken = getJwtToken(req);

    // check if token exits
    if (jwtToken) return res.redirect("/");
    next();
};

const allowedRole = (...roles) => {
    return async (req, res, next) => {
        const user = await prisma.user.findUnique({
            where: {
                id: getUser(req),
            },
            select: {
                role: {
                    select: {
                        name: true,
                    },
                },
            },
        });
        if (!roles.includes(user.role.name)) {
            if (
                user.role.name === "ADMIN" ||
                user.role.name === "ADMIN TEKNIS" ||
                user.role.name === "OPERATOR"
            )
                return res.redirect("/dashboard");
            if (user.role.name === "USER") return res.redirect("/");
        }

        if (roles.includes(user.role.name)) return next();
    };
};

/** Memastikan halaman hanya bisa diakses oleh user yang sudah terverifikasi */
const accountIsVerified = async (req, res, next) => {
    try {
        const { accountIsVerified } = await prisma.user.findUnique({
            where: { id: getUser(req) },
        });
        if (!accountIsVerified) throw "Your account not verified";
        return next();
    } catch (error) {
        return res.redirect("/auth/need-email-verification");
    }
};

/** Memastikan halaman hanya bisa diakses oleh user yang belum terverifikasi */
const userEmailNotVerify = async (req, res, next) => {
    try {
        const { emailIsVerified } = await prisma.user.findUnique({
            where: { id: getUser(req) },
        });
        if (emailIsVerified) throw "Your email already verified";
        return next();
    } catch (error) {
        return res.redirect("/");
    }
};

module.exports = {
    loginRequired,
    allowedRole,
    logoutRequired,
    accountIsVerified,
    userEmailNotVerify,
};

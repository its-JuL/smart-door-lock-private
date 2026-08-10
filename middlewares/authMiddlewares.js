if (process.env.NODE_ENV !== "PRODUCTION") require("dotenv").config();
const jwt = require("jsonwebtoken");
const { resError, ErrorException } = require("../services/responseHandler");
const {
    getJwtToken,
    getUser,
    verifyJwt,
    hashChecker,
    setCookie,
} = require("../services/auth");
const crypto = require("crypto");
const prisma = require("../prisma/client");

/** Fungsi untuk memastikan user sudah login dan memiliki jwt yang aktif */
const loginRequired = (req, res, next) => {
    const jwtToken = getJwtToken(req);

    // check if token exits
    if (!jwtToken)
        return resError({
            res,
            title: "Login Requires! Please Login",
            code: 401,
        });

    jwt.verify(jwtToken, process.env.SECRET, async (err, decode) => {
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
                res.cookie("jwt", "", { maxAge: 1 });
                return resError({
                    res,
                    title: "Some information change, please relogin",
                    code: 401,
                });
            }

            if (!user)
                return resError({
                    res,
                    title: "Cant find the user",
                    code: 401,
                });

            if (user) return next();
        } else {
            return resError({
                res,
                title: "Token is not valid",
                code: 401,
            });
        }
    });
};

/** Fungsi untuk memastikan user sudah logout/ tidak ada cookie dan jwt yang aktif */
const logoutRequired = (req, res, next) => {
    const jwtToken = getJwtToken(req);

    // check if token exits
    if (jwtToken)
        return resError({
            res,
            title: "Logout Requires! Please Logout First",
        });
    next();
};

/** Fungsi untuk memastikan hanya role tertentu yang bisa masuk ke dalam sistem */
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
        if (!roles.includes(user.role.name))
            return resError({
                res,
                title: `${user.role.name} not allow to perform this action`,
                code: 401,
            });

        if (roles.includes(user.role.name)) return next();
    };
};

/** Fungsi untuk mengatur agar user bisa di akses melalui res.local.user */
const setUser = async (req, res, next) => {
    try {
        const uuid = getUser(req);
        const user = await prisma.user.findUnique({
            where: {
                id: uuid,
            },
            select: {
                username: true,
                profil: true,
            },
        });
        res.locals.user = user.username;
        res.locals.id = user.id;
        res.locals.profil_path =
            user.profil.photo || "/image/illustration-user.png";
        req.user = user.username;
        req.id = user.id;
        req.profil_path = user.profil.photo || "/image/illustration-user.png";
        next();
    } catch (error) {
        res.locals.user = "";
        next();
    }
};

const defaultRoleIsExist = async (req, res, next) => {
    try {
        const defaultRole = await prisma.role.findUnique({
            where: {
                name: "USER",
            },
        });
        if (defaultRole === null) throw "DEFAULT ROLE CANT FIND";
        return next();
    } catch (errors) {
        return resError({
            res,
            title: "Internal Server Cant Find The Default Role",
            errors,
        });
    }
};

const adminRoleIsExist = async (req, res, next) => {
    try {
        const defaultRole = await prisma.role.findUnique({
            where: {
                name: "ADMIN",
            },
        });
        if (defaultRole === null) throw "ADMIN ROLE CANT FIND";
        return next();
    } catch (errors) {
        return resError({
            res,
            title: "Internal Server Cant Find The Default Role",
            errors,
        });
    }
};

/** Fungsi untuk memastikan username user sudah terdaftar */
const userIsExist = async (req, res, next) => {
    try {
        const username =
            req.body.username || req.params.username || req.query.username;
        const user = await prisma.user.findUnique({
            where: {
                username,
            },
            select: {
                id: true,
            },
        });

        // give response if cant find the user
        if (user === null)
            throw new ErrorException({
                type: "username",
                detail: "Cant find the user",
                location: "Auth Midlleware",
            });

        return next();
    } catch (errors) {
        return resError({ res, title: "Something Wrong", errors });
    }
};

/** Fungsi untuk memastikan email user sudah terdaftar */
const emailIsExist = async (req, res, next) => {
    try {
        const { email } = req.body;
        const user = await prisma.user.findUnique({
            where: {
                email,
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
        if (user === null)
            throw new ErrorException({
                type: "email",
                detail: "Cant find the user",
                location: "Auth Midlleware",
            });

        return next();
    } catch (errors) {
        return resError({ res, title: "Something Wrong", errors });
    }
};

/** Fungsi untuk memastikan email user belum pernah terdaftar */
const emailIsNotExist = async (req, res, next) => {
    try {
        const { email } = req.body;
        const user = await prisma.user.findUnique({
            where: {
                email,
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
        if (user)
            throw new ErrorException({
                type: "email",
                detail: "Email already exist or register",
                location: "Auth Midlleware",
            });

        return next();
    } catch (errors) {
        return resError({ res, title: "Something Wrong", errors });
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
        return resError({
            res,
            errors: error,
            title: "Email already verified",
        });
    }
};

/** Memastikan halaman hanya bisa diakses oleh user yang sudah terverifikasi */
const userEmailIsVerify = async (req, res, next) => {
    try {
        const { emailIsVerified } = await prisma.user.findUnique({
            where: { id: getUser(req) },
        });
        if (!emailIsVerified) throw "Your email not verified";
        return next();
    } catch (error) {
        return resError({
            res,
            errors: error,
        });
    }
};

/** Fungsi untuk memastikan username (pada form) user belum terdaftar */
const userIsNotExist = async (req, res, next) => {
    try {
        const { username } = req.body;
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
        if (user)
            throw new ErrorException({
                type: "username",
                detail: "User already exist or register",
                location: "Auth Midlleware",
            });

        return next();
    } catch (errors) {
        return resError({ res, title: "Something Wrong", errors });
    }
};

/** Fungsi yang memastikan user yang sedang login tidak bisa menghapus dirinya sendiri */
const notCurrentUser = async (req, res, next) => {
    const deletedUser = req.params.id;
    const token = getUser(req);
    if (deletedUser !== token) return next();
    return resError({
        res,
        errors: "Cannot modify active user",
    });
};

/** Fungsi untuk mengecek apakah token masih aktif dan ada di database */
const urlTokenIsValid = async (req, res, next) => {
    const { token } = req.query;
    let user;
    const secret = crypto.createHash("sha256").update(token).digest("hex");
    try {
        user = await prisma.user.findUnique({ where: { token: secret } });
        if (user === null) throw "Token is not valid";
        if (new Date() > user.tokenExpiredAt) throw "Token is expired";
        return next();
    } catch (error) {
        if (error === "Token is expired") {
            await prisma.user.update({
                where: { id: user.id },
                data: { token: null, tokenExpiredAt: null },
            });
        }
        return resError({
            res,
            errors: error,
        });
    }
};

module.exports = {
    loginRequired,
    allowedRole,
    setUser,
    defaultRoleIsExist,
    adminRoleIsExist,
    userIsExist,
    logoutRequired,
    userIsNotExist,
    emailIsNotExist,
    notCurrentUser,
    urlTokenIsValid,
    userEmailIsVerify,
    userEmailNotVerify,
    emailIsExist,
};

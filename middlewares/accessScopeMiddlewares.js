const prisma = require("../prisma/client");
const { getUser } = require("../services/auth");
const { resError } = require("../services/responseHandler");
const { createAccessScope } = require("../services/operatorScope");

function createAccessScopeLoader(dependencies = {}) {
    const db = dependencies.prisma || prisma;
    const resolveUserId = dependencies.getUser || getUser;

    return async (req, res, next) => {
        try {
            const userId = resolveUserId(req);
            const user = await db.user.findUnique({
                where: { id: userId },
                select: {
                    id: true,
                    role: { select: { name: true } },
                    Building: {
                        select: {
                            id: true,
                            rooms: {
                                select: {
                                    id: true,
                                    ruid: true,
                                    device: { select: { device_id: true } },
                                },
                            },
                        },
                    },
                },
            });

            if (!user) {
                return resError({
                    res,
                    code: 401,
                    title: "Authenticated user was not found",
                });
            }

            req.accessScope = createAccessScope({
                userId: user.id,
                roleName: user.role.name,
                buildings: user.Building,
            });
            return next();
        } catch (errors) {
            return resError({
                res,
                code: 500,
                title: "Failed to resolve authorization scope",
                errors,
            });
        }
    };
}

const loadAccessScope = createAccessScopeLoader();

module.exports = { createAccessScopeLoader, loadAccessScope };

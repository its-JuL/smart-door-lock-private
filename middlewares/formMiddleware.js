const { validationResult } = require("express-validator");
const { resError, ErrorException } = require("../services/responseHandler");

const formChacker = (req, res, next) => {
    try {
        const errors = validationResult(req);
        if (errors.isEmpty()) return next();
        errors.errors.forEach((error) => {
            throw new ErrorException({
                type: error.param,
                detail: error.msg,
                location: `${error.location} form middleware`,
            });
        });
    } catch (error) {
        return resError({
            res,
            title: `Invalid ${error.errors.type} value`,
            errors: error,
            code: 403,
        });
    }
};

module.exports = { formChacker };

const bcrypt = require("bcrypt");
const jwt = require("jsonwebtoken");
const saltRounds = 10;

/**  Createing max age of a token, changeable from .env */
const expTime = () => {
    const maxAge = Number(process.env.MAX_AGE) || 3 * 24 * 60 * 60; // 3 days
    return maxAge;
};

/** Creating jwt token, the default expired date is 3 days*/
const createJwtToken = (data, exp = expTime()) => {
    return jwt.sign(data, process.env.SECRET, {
        expiresIn: exp,
    });
};

/**  Getting jwt token from request */
const getJwtToken = (req) => {
    try {
        return req.cookies.jwt;
    } catch (error) {
        return false;
    }
};

/** Get uuid from req */
const getUser = (req) => {
    const UUID = jwt.verify(
        getJwtToken(req),
        process.env.SECRET,
        (err, decode) => {
            return decode?.id;
        }
    );
    return UUID;
};

/** Verify JwT */
const verifyJwt = (data, secret = process.env.SECRET) => {
    const payload = jwt.verify(data, secret, (err, decode) => decode);
    return payload;
};

/** Set Cookie To User Browser */
const setCookie = ({
    res,
    title,
    data,
    secure = true,
    exp = expTime() * 1000,
}) => {
    res.cookie(title, data, {
        httpOnly: secure,
        maxAge: exp,
    });
};

/** Set authentication cookie */
const setAuthCookie = ({ res, uuid }) => {
    setCookie({ res, title: "jwt", data: createJwtToken({ id: uuid }) });
};

/**
 * Function to hash input number or string.
 * @param {string} text Input string to hash.
 * */
const hasher = (text) => {
    const hashPassword = bcrypt.hashSync(text, bcrypt.genSaltSync(saltRounds));
    return hashPassword;
};

/**
 * Funstion to check hash text with the original plain text, wil return boolean.
 * @param {string} password Plain text to check
 * @param {string} hashPassword Hash text to validate the plain text
 * @returns {boolean} return boolean value
 */
const hashChecker = (password, hashPassword) => {
    const isTruePassword = bcrypt.compareSync(password, hashPassword);
    return isTruePassword;
};

module.exports = {
    createJwtToken,
    expTime,
    getJwtToken,
    getUser,
    setCookie,
    setAuthCookie,
    hasher,
    hashChecker,
    verifyJwt,
};

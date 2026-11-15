const googleAuth = require("../services/googleAuth");

module.exports.login = (req, res) => {
    const data = {
        styles: ["/style/auth.css"],
        scripts: ["/js/login.js", "/js/googleLogin.js"],
        googleClientId: googleAuth.clientId,
        googleEnabled: googleAuth.isEnabled,
        layout: "auth.hbs",
    };
    res.render("login", data);
};

module.exports.register = (req, res) => {
    const data = {
        styles: ["/style/auth.css"],
        scripts: ["/js/register.js"],
        layout: "auth.hbs",
    };
    res.render("register", data);
};

module.exports.forget = (req, res) => {
    const data = {
        styles: ["/style/auth.css"],
        scripts: ["/js/forgot.js"],
        layout: "auth.hbs",
    };
    res.render("forgetpassword", data);
};

module.exports.reset = (req, res) => {
    const data = {
        styles: ["/style/auth.css"],
        scripts: ["/js/reset.js"],
        layout: "auth.hbs",
    };
    res.render("reset", data);
};

module.exports.needEmailVerification = (req, res) => {
    const data = {
        styles: ["/style/auth.css"],
        scripts: ["/js/needEmailVerification.js"],
        layout: "auth.hbs",
    };
    res.render("needEmailVerification", data);
};

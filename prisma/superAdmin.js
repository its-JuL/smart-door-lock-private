const { hasher } = require("../services/auth");

const role = [
    {
        name: "USER",
    },
    {
        name: "ADMIN",
    },
    {
        name: "ADMIN TEKNIS",
    },
    {
        name: "OPERATOR",
    },
];

const user = [
    {
        username: "dimasaulia",
        email: "dimasauliafachrudin@gmail.com",
        password: hasher("T4np4$4nd1"),
        role: "ADMIN",
    },
];

const rooms = [
    {
        name: "RUANG PERCOBAAN",
    },
];

module.exports = { user, role, rooms };

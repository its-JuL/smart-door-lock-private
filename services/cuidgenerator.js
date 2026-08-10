const crypto = require("crypto");

function generateCuid() {
    const randomBytes = crypto.randomBytes(10).toString("hex");
    const timestamp = Date.now().toString(36).slice(-4);
    const cuid = randomBytes + timestamp;
    return cuid;
}

module.exports = { generateCuid };

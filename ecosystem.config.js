// Konfigurasi PM2 untuk Smart Door Lock.
//
// app.js hanya memuat dotenv ketika NODE_ENV !== "PRODUCTION", jadi di server
// variabel .env harus disuntikkan dari sini; jangan mengandalkan dotenv di app.
require("dotenv").config({ path: require("path").join(__dirname, ".env") });

module.exports = {
    apps: [
        {
            name: "smart-doorlock",
            script: "app.js",
            cwd: __dirname,
            instances: 1,
            exec_mode: "fork",
            autorestart: true,
            max_memory_restart: "800M",
            env: {
                ...process.env,
                NODE_ENV: "PRODUCTION",
            },
        },
    ],
};

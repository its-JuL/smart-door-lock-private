if (process.env.NODE_ENV !== "PRODUCTION") require("dotenv").config();
const express = require("express");
const cors = require("cors");
const cookieParser = require("cookie-parser");
const app = express();
const fs = require("fs");
const options = {
    key: fs.readFileSync("./ssl/privatekey-pnj.ac.id.key"),
    cert: fs.readFileSync("./ssl/ssl_certificate-pnj.ac.id.crt"),
};
const http = require("http").Server(app);
// const https = require("https").createServer(options, app);
// const io = require("socket.io")(https);
const io = require("socket.io")(http);
const expbs = require("express-handlebars");
const { urlErrorHandler } = require("./services/responseHandler");
const { MQTTConnection } = require("./connection/mqtt");
app.io = io;

const { MQTTLogger } = require("./services/mqttLogger");
MQTTLogger.start();

const path = require("path");
const livereload = require("livereload");
const connectLiveReload = require("connect-livereload");
const liveReloadServer = livereload.createServer();
liveReloadServer.watch(path.join(__dirname, "views"));
liveReloadServer.server.once("connection", () => {
    setTimeout(() => {
        liveReloadServer.refresh("/");
    }, 50);
});
app.use(require("express-status-monitor")());
app.use(connectLiveReload());
app.use(express.urlencoded({ extended: false }));
app.use(express.json());
app.use(cookieParser());
app.use(cors());
app.use(express.static("public"));
app.use("/static", express.static("public"));
// app.use(
//     express.session({
//         secret: "somethingtobesecret",
//     })
// );
app.engine(
    "handlebars",
    expbs.engine({ extname: ".hbs", defaultLayout: "base" })
);
app.set("views", "views");
app.set("view engine", "handlebars");

const PORT = process.env.PORT || 8000;
const ROUTER = require("./router");

app.use("/", ROUTER);
app.use(urlErrorHandler);

io.on("connection", (socket) => {
    console.log("A client connected 🚀");
    socket.on("disconnect", () => {
        console.log("A client disconnected 📡");
    });
});

// https.listen(PORT, () => {
//     console.log(`🤘 SERVER RUNNING IN PORT ${PORT}`);
// });
MQTTConnection.createConnection();
http.listen(PORT, () => {
    console.log(`🤘 SERVER RUNNING IN PORT ${PORT}`);
});

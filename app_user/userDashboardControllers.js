module.exports.home = (req, res) => {
    const data = {
        layout: "userBase",
        card: "bg-neutral-4",
        styles: ["/style/userCardList.css"],
        scripts: ["/js/user/cardList.js"],
    };
    res.render("user/user", data);
};

module.exports.cardLogs = async (req, res) => {
    const { id } = req.params;
    const data = {
        layout: "userBase",
        card: "bg-neutral-4",
        styles: ["/style/userCardLogs.css"],
        scripts: ["/js/user/cardLogs.js"],
        id,
    };
    res.render("user/userCardLogs", data);
};

module.exports.cardChangePin = (req, res) => {
    const { id } = req.params;
    const data = {
        layout: "userBase",
        card: "bg-neutral-4",
        styles: ["/style/changePin.css"],
        scripts: ["/js/user/cardChangePin.js"],
        id,
    };
    res.render("user/userChangePin", data);
};

module.exports.cardRoom = (req, res) => {
    const { card: id } = req.params;
    const data = {
        layout: "userBase",
        card: "bg-neutral-4",
        styles: [
            "/style/userCardLogs.css",
            "/style/buildingList.css",
            "/style/api.css",
            "/style/userCardRoom.css",
        ],
        scripts: ["/js/user/cardRoomScrolhandler.js", "/js/user/cardRoom.js"],
        id,
    };
    res.render("user/userCardRoom", data);
};

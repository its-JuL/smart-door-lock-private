startLoader();
const cardNumberContainer = document.querySelector(".card-number");
const cardNumber = cardNumberContainer.getAttribute("data-id");
const cardIcon = document.querySelector(".card-icon");
const roomContainer = document.querySelector(".request-room");
const buildingContainer = document.querySelector(".building-container");
const accessableRoomContainer = document.querySelector(
    ".accessable-table-container"
);
const loadMoreRoomList = document.querySelector("#load-more");
const loadMoreBuildingList = document.querySelector("#loadMoreBuilding");
const loadMoreAccessableRoom = document.querySelector(
    "#load-more-accessable-room"
);
const searchValue = document.querySelector("#searchForm");
const searchBtn = document.querySelector("#searchBtn");
let buildingId = "all";

const roomRequestTemplate = ({ room: { ruid, name, id }, no, cardNumber }) => {
    return `
    <div class="table-row d-flex align-items-center py-1 py-md-2 justify-content-between px-3 hardware--list-item" id="room-${id}" data-id="${id}" data-url="/api/v1/room/u/request?ruid=${ruid}&cardNumber=${cardNumber}">
        <span class="table-data align-middle text-center text-neutral-2">${no}</span>
        <p class="table-data text-center text-neutral-2" data-id="${ruid}">
            ${ruid}</p>
        <p class="table-data text-center text-neutral-2">
            ${name}</p>
        <span
            class="table-data text-center align-bottom text-blue-4 fw-bold pointer bg-blue-2 py-1 rounded-13 choose" onclick="requestRoom('${id}')">
            Request
        </span>
    </div>
    `;
};

const accesableRoomTemplate = ({ ruid, name, id }) => {
    return `
    <div class="row bg-neutral-7 p-2 rounded-10 mt-2 accessables-room" data-accessable-room=${id}>
        <div class="col-6">
            <p class="text-center text-neutral-2">${ruid}</p>
        </div>
        <div class="col-6">
            <p class="text-center text-neutral-2">${name}</p>
        </div>
    </div>
    `;
};

const basicInfoLoader = (data) => {
    cardNumberContainer.textContent = data.info.card_name + " Accessable Room";
    cardIcon.setAttribute("src", `/image/icon_${data.info.type}.svg`);
};

// INFO: Basic Room info
const basicInfoErrHandler = (err) => {
    showToast({
        theme: "danger",
        title: err,
        desc: "Failed to load card image",
    });
};

generalDataLoader({
    url: `/api/v1/card/u/${cardNumber}`,
    func: basicInfoLoader,
    errHandler: basicInfoErrHandler,
});

const requestRoom = async (id) => {
    const url = document.querySelector(`#room-${id}`).getAttribute("data-url");
    const resp = await setter({
        url,
    });
};

// INFO: Room List
const firstRoomListLoader = (data) => {
    data.forEach((room) => {
        let no = document.querySelectorAll(".hardware--list-item");
        roomContainer.insertAdjacentHTML(
            "beforeend",
            roomRequestTemplate({ room, no: no.length + 1, cardNumber })
        );
    });
};

generalDataLoader({
    url: `/api/v1/room/u/list`,
    func: firstRoomListLoader,
});

loadMoreRoomList.addEventListener("click", () => {
    const cursor = lastCursorFinder(".hardware--list-item", "id");
    if (searchValue.value.length === 0 && buildingId === "all") {
        generalDataLoader({
            url: `/api/v1/room/u/list?cursor=${cursor}`,
            func: firstRoomListLoader,
        });
    }

    if (searchValue.value.length > 0 && buildingId === "all") {
        generalDataLoader({
            url: `/api/v1/room/u/list?cursor=${cursor}&search=${searchValue.value}`,
            func: firstRoomListLoader,
        });
    }

    if (
        searchValue.value.length === 0 &&
        buildingId !== "all" &&
        buildingId.length > 0
    ) {
        generalDataLoader({
            url: `/api/v1/room/u/list?cursor=${cursor}&building=${buildingId}`,
            func: firstRoomListLoader,
        });
    }

    if (
        searchValue.value.length > 0 &&
        buildingId !== "all" &&
        buildingId.length > 0
    ) {
        generalDataLoader({
            url: `/api/v1/room/u/list?search=${searchValue.value}&building=${buildingId}&cursor=${cursor}`,
            func: firstRoomListLoader,
        });
    }
});

searchBtn.addEventListener("click", () => {
    roomContainer.textContent = "";
    if (
        searchValue.value.length > 0 &&
        buildingId !== "all" &&
        buildingId.length > 0
    ) {
        generalDataLoader({
            url: `/api/v1/room/u/list?search=${searchValue.value}&building=${buildingId}`,
            func: firstRoomListLoader,
        });
    }

    if (searchValue.value.length > 0 && buildingId === "all") {
        generalDataLoader({
            url: `/api/v1/room/u/list?search=${searchValue.value}`,
            func: firstRoomListLoader,
        });
    }
});

// INFO: Building List
const buildingSelectorHandler = (id) => {
    searchValue.value = "";
    document.querySelectorAll(".building-list-item").forEach((e) => {
        e.classList.remove("bg-blue-4");
        e.classList.add("bg-blue-3");
    });
    document.getElementById("building-" + id).classList.remove("bg-blue-3");
    document.getElementById("building-" + id).classList.add("bg-blue-4");
    roomContainer.textContent = "";
    if (id !== "all") {
        buildingId = id;
        generalDataLoader({
            url: `/api/v1/room/u/list/?building=${buildingId}`,
            func: firstRoomListLoader,
        });
    } else {
        buildingId = "all";
        generalDataLoader({
            url: `/api/v1/room/u/list/`,
            func: firstRoomListLoader,
        });
    }
};

const buildingDataTemplate = (data) => {
    return `
        <p 
            class="building-list-item px-4 py-1 rounded-10 fw-bold text-neutral-7 bg-blue-3 me-2" 
            id="building-${data.id}" 
            data-id="${data.id}" 
            onclick="buildingSelectorHandler('${data.id}')">
            ${data.name}
        </p>
    `;
};

const buildingListLoader = (data) => {
    data.forEach((building) => {
        buildingContainer.insertAdjacentHTML(
            "beforeend",
            buildingDataTemplate(building)
        );
    });
};

generalDataLoader({
    url: `/api/v1/building/u/list`,
    func: buildingListLoader,
});

loadMoreBuildingList.addEventListener("click", () => {
    const cursor = lastCursorFinder(".building-list-item", "id");
    generalDataLoader({
        url: `/api/v1/building/u/list?cursor=${cursor}`,
        func: buildingListLoader,
    });
});

// INFO: Accessable Room
const accessableRoomLoader = (data) => {
    data.forEach((room) => {
        accessableRoomContainer.insertAdjacentHTML(
            "beforeend",
            accesableRoomTemplate(room)
        );
    });
};

const accessableRoomErrHandler = (err) => {
    showToast({
        theme: "danger",
        title: err,
        desc: "Failed to load accessable room list",
    });
};

generalDataLoader({
    url: `/api/v1/room/u/accesable/${cardNumber}`,
    func: accessableRoomLoader,
    errHandler: accessableRoomErrHandler,
});

loadMoreAccessableRoom.addEventListener("click", () => {
    const cursor = lastCursorFinder(".accessables-room", "accessable-room");
    generalDataLoader({
        url: `/api/v1/room/u/accesable/${cardNumber}?cursor=${cursor}`,
        func: accessableRoomLoader,
        errHandler: accessableRoomErrHandler,
    });
});

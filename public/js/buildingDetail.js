const buildingId = window.location.href.split("/").splice(-1)[0];
const operatorAddButton = document.getElementById("operatorAddButton");
const roomAddButton = document.getElementById("roomAddButton");
const operatorList = document.getElementById("operatorList");
const roomList = document.getElementById("roomList");
const operatorsCount = document.getElementById("operatorsCount");
const linkedRoomCount = document.getElementById("linkedRoomCount");
const saveButton = document.getElementById("save");
const buildingName = document.getElementById("buildingName");
const operators = new Set();
const rooms = new Map();

const removeTableItem = (element) => {
    if (element.startsWith("operator")) {
        operators.delete(element.split("$")[1]);
        updateList(operators, "operator");
    }
    if (element.startsWith("room")) {
        rooms.delete(element.split("$")[1]);
        updateList(rooms, "room");
    }
};

const tableItemTemplate = (data, ...name) => {
    return `
    <div class="table-row d-flex py-2 py-md-2 justify-content-between px-3" id="${data}">
        <p class="table-data text-center text-neutral-2">${
            name || data.split("$")[1]
        }</p>
        <span class="table-data hover-tool me-1 pointer d-flex justify-content-center" 
            onclick = "removeTableItem('${data}')"
            data-hover="Delete">
            <img src="/image/icon_delete.svg" alt="Delete" class="image">
        </span>
    </div>
    `;
};

const updateList = (datas, type) => {
    if (type === "operator") {
        operatorList.textContent = "";
        datas.forEach((data) => {
            operatorList.insertAdjacentHTML(
                "beforeend",
                tableItemTemplate(`${type}$${data}`, data)
            );
        });
        operatorsCount.textContent = datas.size;
    }

    if (type === "room") {
        roomList.textContent = "";
        datas.forEach((data, key) => {
            roomList.insertAdjacentHTML(
                "beforeend",
                tableItemTemplate(`${type}$${key}`, data)
            );
        });
        linkedRoomCount.textContent = datas.size;
    }
};

const buildingDetail = (data) => {
    buildingName.value = data.name;
    operatorsCount.textContent = data.operator.length;
    linkedRoomCount.textContent = data.rooms.length;
    data.operator.forEach((operator) => {
        operators.add(operator.username);
    });
    data.rooms.forEach((room) => {
        rooms.set(room.ruid, room.name);
    });
    updateList(operators, "operator");
    updateList(rooms, "room");
};

const resp = generalDataLoader({
    url: `/api/v1/building/detail/${buildingId}`,
    func: buildingDetail,
});

$("#operator").autocomplete({
    source: "/api/v1/user/autocomplete?role=OPERATOR",
    select: function (event, ui) {
        event.preventDefault();
        document.querySelector("#operator").value = ui.item.label;
        document.querySelector("#operatorId").value = ui.item.value;
    },
});

$("#roomname").autocomplete({
    source: "/api/v1/room/autocomplate",
    select: function (event, ui) {
        event.preventDefault();
        document.querySelector("#roomname").value = ui.item.label;
        document.querySelector("#roomId").value = ui.item.value;
    },
});

operatorAddButton.addEventListener("click", (e) => {
    e.preventDefault();
    operators.add(document.querySelector("#operator").value);
    updateList(operators, "operator");
});

roomAddButton.addEventListener("click", (e) => {
    e.preventDefault();
    rooms.set(
        document.querySelector("#roomId").value,
        document.querySelector("#roomname").value
    );
    updateList(rooms, "room");
});

saveButton.addEventListener("click", async (e) => {
    const arrayOfRoom = [];
    rooms.forEach((_, key) => {
        arrayOfRoom.push(key);
    });
    const resp = await setter({
        url: "/api/v1/building/update",
        body: {
            buildingId,
            name: buildingName.value,
            usernames: [...operators],
            ruids: arrayOfRoom,
        },
    });
});

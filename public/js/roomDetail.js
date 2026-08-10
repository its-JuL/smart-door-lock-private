const roomIdContainer = document.querySelector(".room-id");
const ruid = roomIdContainer.getAttribute("data-ruid");
const roomNameContainer = document.querySelector("#room-name");
const ruidContainer = document.querySelector("#ruid");
const duidContainer = document.querySelector("#duid");
const onlineContainer = document.querySelector("#online");
const itemContainer = document.querySelector(".data-container");
const accessContainer = document.querySelector(".activity-access");
const visitorContainer = document.querySelector("#visitor");
const numberOfUserContainer = document.querySelector("#user");
const numberOfRequestUserContainer = document.querySelector("#request-user");
const showMoreBtn = document.querySelector("#logs-show-more");
const addCardForm = document.getElementById("addCardForm");
const searchCard = document.getElementById("searchCard");

let mode = "USER"; // antoher value is LOG

const basicInfoLoader = (data) => {
    roomIdContainer.textContent = `${data.detailRoom.name.toUpperCase()} Detail`;
    roomNameContainer.textContent = data.detailRoom.name.toUpperCase();
    ruidContainer.textContent = data.detailRoom.ruid;
    duidContainer.textContent = data.detailRoom.device.device_id;
    onlineContainer.textContent = data.detailRoom.device.lastOnline
        ? days(data.detailRoom.device.lastOnline)
        : "-";
    visitorContainer.textContent = data.numberOfVisitor;
    numberOfUserContainer.textContent = data.accaptableUser;
    numberOfRequestUserContainer.textContent = data.requestUser;
};

generalDataLoader({
    url: `/api/v1/room/detail/${ruid}`,
    func: basicInfoLoader,
});

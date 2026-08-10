const showMoreBtn = document.querySelector("#showMore");
const hwForm = document.querySelector("#hw");
const hwContainer = document.querySelector(".hw-container");
const searhcBtn = document.querySelector(".input-group-prepend");
const duidForm = document.querySelector("#duid");
const roomNameForm = document.querySelector("#room-name");
const roomStatusForm = document.querySelector("#room-status");
const updateBtn = document.querySelector("#create-button");
const ruid = document.querySelector("#data-ruid");

const hardwareTemplate = (data, id) => {
    return `
        <div class="table-row d-flex align-items-center py-1 py-md-2 justify-content-between px-3 hardware--list-item" id="hw-${
            data.id
        }" data-id=${data.id}>
            <span class="table-data align-middle text-center text-neutral-2">${id}</span>
            <p class="table-data text-center text-neutral-2" data-id="${
                data.device_id
            }">
                ${data.device_id}</p>
            <p class="table-data text-center text-neutral-2">
                ${days(data.createdAt)} WIB</p>
            <span
                class="table-data text-center align-bottom text-blue-4 fw-bold pointer bg-blue-2 py-1 rounded-13 choose" onclick="chooseHandler('${
                    data.device_id
                }')">
                Choose
            </span
        </div>
    `;
};

const hardwareListLoader = (data) => {
    data.forEach((api) => {
        const apiLength = document.querySelectorAll(".hardware--list-item");
        hwContainer.insertAdjacentHTML(
            "beforeend",
            hardwareTemplate(api, apiLength.length + 1)
        );
    });
};

const chooseHandler = (duid) => {
    duidForm.value = duid;
};

showMoreBtn.addEventListener("click", (e) => {
    e.preventDefault();
    const cursor = lastCursorFinder(".hardware--list-item", "id");
    const search = hwForm.value;
    if (search.length === 0) {
        generalDataLoader({
            url: `/api/v2/room/device/list?available=true&cursor=${cursor}`,
            func: hardwareListLoader,
        });
    }
    if (search.length > 0) {
        generalDataLoader({
            url: `/api/v2/room/device/list?available=true&cursor=${cursor}&search=${search}`,
            func: hardwareListLoader,
        });
    }
});

searhcBtn.addEventListener("click", (e) => {
    e.preventDefault();
    hwContainer.textContent = "";
    const search = hwForm.value;
    generalDataLoader({
        url: `/api/v2/room/device/list?available=true&search=${search}`,
        func: hardwareListLoader,
    });
});

updateBtn.addEventListener("click", async (e) => {
    e.preventDefault();
    const resp = await setter({
        url: `/api/v1/room/update/${ruid.getAttribute("data-ruid")}`,
        body: {
            roomName: roomNameForm.value,
            isActive: roomStatusForm.checked,
            duid: duidForm.value,
            buildingId: document.querySelector("#buildingId").value,
        },
        successMsg: "Success update room",
        successBody: "Redirecting you to room list",
    });

    if (resp.success) {
        setTimeout(() => {
            window.location = "/dashboard/room/list";
        }, 3500);
    }
});

$("#buildingName").autocomplete({
    source: "/api/v1/building/autocomplate",
    select: function (event, ui) {
        event.preventDefault();
        document.querySelector("#buildingName").value = ui.item.label;
        document.querySelector("#buildingId").value = ui.item.value;
    },
});

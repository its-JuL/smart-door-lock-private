const roomConatiner = document.querySelector(".room--list-container");
const showMoreBtn = document.querySelector("#showMore");
const roomnameForm = document.querySelector("#roomname");
const searchBtn = document.querySelector(".input-group-prepend");
const roleOfUser = document
    .querySelector("#admin-role")
    .getAttribute("data-role");

const deleteAction = ({ url, element }) => {
    startLoader();

    fetch(url, {
        method: "DELETE",
    })
        .then((res) => {
            if (!res.ok) throw "Something wrong";
            return res.json();
        })
        .then((data) => {
            closeLoader();
            showToast({
                theme: "success",
                title: "Action complate",
                desc: `Success delete ${data.data.name}`,
            });
            element.remove();
        })
        .catch((e) => {
            closeLoader();
            showToast({
                theme: "danger",
                title: "Action failed",
                desc: "Failed to delete room",
            });
        });
};

const deleteToggle = (ruid, roomName) => {
    const url = `/api/v1/room/delete/${ruid}`;
    const element = document.getElementById("room-template-" + ruid);
    showAlertConfirm({
        theme: "danger",
        title: "Delete confirmation!",
        desc: `Are you sure you want to delete the ${roomName} room`,
        link: "#",
        btn: "Delete",
        exec: () => deleteAction({ url, element }),
    });
};

const roomListTemplate = ({ name, ruid, id, device }) => {
    return `
    <div
        class="room--list-item mt-3 d-flex flex-column flex-sm-row align-items-center justify-content-between bg-neutral-7 shadow-c-1 px-5 py-3 rounded-13" id="room-template-${ruid}" data-ruid="${ruid}" data-id="${id}" data-room-name="${name}">
        <div class="room-profile d-flex flex-column flex-sm-row justify-content-start align-items-center">
            <div class="room-profile-picture">
                <img src="/image/icon_room.svg" alt="Profil">
            </div>

            <div class="ms-sm-4 ms-0 mt-3 mt-sm-0">
                <h5 class="fw-bolder text-blue-4">${name}</h5>
                <p class="text-blue-3">Room ID: <span class="fw-bold"> ${ruid} </span></p>
                <p class="text-blue-3">Device ID: <span class="fw-bold"> ${
                    device?.device_id ? device?.device_id : "Not paired"
                } </span></p>
                <p class="text-blue-3">Last seen: <span class="fw-bold"> ${
                    device?.lastOnline ? days(device.lastOnline) + " WIB" : "-"
                } </span> </p>
            </div>
        </div>

        ${
            roleOfUser === "ADMIN"
                ? `
            <div class="d-flex mt-3 mt-sm-0 mb-4 mb-sm-0">
                <a href="/dashboard/room/edit/${ruid}">
                    <img src="/image/icon_edit.svg" alt="Ikon edit" class="form-icons">
                </a>
                <p class="ms-3" onclick="deleteToggle('${ruid}','${name}')">
                    <img src="/image/icon_delete.svg" alt="Ikon hapus" class="form-icons delete-room">
                </p>
            </div>
        `
                : ""
        }

        <a href="/dashboard/room/detail/${ruid}" class="bg-blue-3 text-neutral-7 py-2 px-4 rounded-13">Detail</a>

    </div>
        `;
};

const roomListLoader = (data) => {
    data.forEach((room) => {
        roomConatiner.insertAdjacentHTML("beforeend", roomListTemplate(room));
    });
};

// INFO: First Load Room List
generalDataLoader({ url: "/api/v1/room/list", func: roomListLoader });

// INFO: First Load Search User List
searchBtn.addEventListener("click", (e) => {
    e.preventDefault();
    const search = roomnameForm.value;
    roomConatiner.textContent = "";
    generalDataLoader({
        url: `/api/v1/room/list?search=${search}`,
        func: roomListLoader,
    });
});

document.addEventListener("keyup", (e) => {
    const search = roomnameForm.value;
    e.preventDefault();
    if (e.key === "Enter" && search.length > 0) {
        e.preventDefault();
        roomConatiner.textContent = "";
        generalDataLoader({
            url: `/api/v1/room/list?search=${search}`,
            func: roomListLoader,
        });
    }
});

document.querySelector(".serach--form").addEventListener("submit", (e) => {
    e.preventDefault();
});

// INFO: Load More Room List
showMoreBtn.addEventListener("click", (e) => {
    e.preventDefault();
    const cursor = lastCursorFinder(".room--list-item", "id");
    const search = roomnameForm.value;
    if (search.length > 0) {
        generalDataLoader({
            url: `/api/v1/room/list/?cursor=${cursor}&search=${search}`,
            func: roomListLoader,
        });
    }
    if (search.length === 0) {
        generalDataLoader({
            url: `/api/v1/room/list/?cursor=${cursor}`,
            func: roomListLoader,
        });
    }
});

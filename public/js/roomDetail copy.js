startLoader();
const roomIdContainer = document.querySelector(".room-id");
const ruid = roomIdContainer.getAttribute("data-ruid");
const roomNameContainer = document.querySelector("#room-name");
const ruidContainer = document.querySelector("#ruid");
const duidContainer = document.querySelector("#duid");
const onlineContainer = document.querySelector("#online");
const itemContainer = document.querySelector(".item-container");
const accessContainer = document.querySelector(".activity-access");
const visitorContainer = document.querySelector("#visitor");
const numberOfUserContainer = document.querySelector("#user");
const numberOfRequestUserContainer = document.querySelector("#request-user");
const showMoreBtn = document.querySelector("#logs-show-more");
const userBtn = document.querySelector("#user-btn");
const showMoreRequestBtn = document.querySelector("#request-show-more");
let mode = "USER"; // antoher value is LOG

const deleteAccessHandler = (cardNumber) => {
    showAlertConfirm({
        theme: "warning",
        title: "Sure for delete?",
        desc: `Are you sure for removing user access`,
        link: "#",
        btn: "Delete",
        exec: async () => {
            const resp = await setter({
                url: "/api/v1/room/unpair",
                body: {
                    ruid,
                    cardNumber,
                },
            });
            if (resp.success) {
                document.querySelector(`#card-id-${cardNumber}`).remove();
            }
        },
    });
};

const accaptableUserTemplate = ({
    card_name,
    user,
    updatedAt,
    id,
    card_number,
}) => {
    return `
    <div
        class="accaptable-user d-flex mt-2 flex-column flex-sm-row justify-content-between align-items-md-center p-2 bg-neutral-7 rounded-5" id="card-id-${card_number}" data-user-uuid=${id}>
        <p href="" class="text-neutral-1">${card_name}@${
        user?.username || "Not have user"
    }</p>
        <p class="text-neutral-2 bg-warning-2 p-1 rounded-10 pointer" onclick=deleteAccessHandler('${card_number}')>Hapus akses</p>
    </div>
    `;
};

const roomLogsTemplate = ({ Card, id, createdAt, isSuccess }) => {
    return `
    <div
        class="room-log d-flex mt-2 flex-column flex-sm-row justify-content-between p-2 bg-neutral-7 rounded-5" data-room-log=${id}>
        <p href="" class="text-neutral-1">${
            Card?.card_name ? Card.card_name : "not identify"
        }@${Card?.user.username || "not found"}</p>
        <a href="" class="text-neutral-2">${
            isSuccess ? "Berhasil " : "Gagal "
        }Mengakses ruangan pada    ${days(createdAt)}
        </a>
    </div>
    `;
};

const requestUserTemplate = ({
    card: { card_number, card_name, user },
    id,
}) => {
    return `
    <div class="col-12 mt-3 request-user" data-request="${id}">
        <div
            class="d-flex flex-column flex-sm-row justify-content-between p-2 bg-neutral-7 rounded-5">
            <a href="" class="text-neutral-2">${card_name}@${
        user?.username || "Not paired"
    }</a>
            <a href="/api/v1/room/pair?ruid=${ruid}&cardNumber=${card_number}&requestId=${id}" class="text-neutral-1 fw-bold request-link">Give Access</a>
        </div>
    </div>
    `;
};

// INFO: Basic Room Information Loader
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

// INFO: Accaptable User List
const accaptableUserLoader = (data) => {
    data.forEach((card) => {
        itemContainer.insertAdjacentHTML(
            "beforeend",
            accaptableUserTemplate(card)
        );
    });
};

generalDataLoader({
    url: `/api/v1/room/accaptable-user/${ruid}`,
    func: accaptableUserLoader,
});

// INFO: More Data Loader
showMoreBtn.addEventListener("click", (e) => {
    if (mode === "USER") {
        const cursor = lastCursorFinder(".accaptable-user", "user-uuid");
        generalDataLoader({
            url: `/api/v1/room/accaptable-user/${ruid}?cursor=${cursor}`,
            func: accaptableUserLoader,
        });
    }

    if (mode === "LOG") {
        const cursor = lastCursorFinder(".room-log", "room-log");
        generalDataLoader({
            url: `/api/v1/room/logs/${ruid}?cursor=${cursor}`,
            func: logsLoader,
        });
    }
    e.preventDefault();
});

userBtn.addEventListener("click", () => {
    itemContainer.textContent = "";
    generalDataLoader({
        url: `/api/v1/room/accaptable-user/${ruid}`,
        func: accaptableUserLoader,
    });
    mode = "USER";
    logsBtn.classList.remove("active");
    userBtn.classList.add("active");
});

const logsLoader = (data) => {
    data.forEach((card) => {
        itemContainer.insertAdjacentHTML("beforeend", roomLogsTemplate(card));
    });
};

logsBtn.addEventListener("click", () => {
    itemContainer.textContent = "";
    generalDataLoader({
        url: `/api/v1/room/logs/${ruid}`,
        func: logsLoader,
    });
    mode = "LOG";
    userBtn.classList.remove("active");
    logsBtn.classList.add("active");
});

// INFO: Request User List
const requestUserLoader = (data) => {
    data.forEach((card) => {
        accessContainer.insertAdjacentHTML(
            "beforeend",
            requestUserTemplate(card)
        );
    });

    const requestLink = document.querySelectorAll(".request-link");
    requestLink.forEach((link) => {
        const href = link.getAttribute("href");
        const listener = link.getAttribute("data-listener");
        if (!listener) {
            link.addEventListener("click", async (e) => {
                e.preventDefault();
                const pair = await setter({
                    url: href,
                    successMsg: "Success give access to user",
                });

                if (pair.success) {
                    link.parentElement.parentElement.remove();
                    itemContainer.insertAdjacentHTML(
                        "afterbegin",
                        `<div
                            class="accaptable-user d-flex mt-2 flex-column flex-sm-row justify-content-between align-items-md-center p-2 bg-neutral-7 rounded-5" data-user-uuid=${data.id}>
                            <p class="text-neutral-1">${pair.data.card[0].card_name}@${pair.data.card[0].user.username}</p>
                            <p class="text-neutral-2 bg-warning-2 p-1 rounded-10 pointer" onclick=deleteAccessHandler('${pair.data.card[0].card_number}') id="card-id-${pair.data.card[0].card_number}">Hapus akses</p>
                        </div>`
                    );
                }
            });
            link.setAttribute("data-listener", "true");
        }
    });
};

generalDataLoader({
    url: `/api/v1/room/requestUser/${ruid}`,
    func: requestUserLoader,
});

showMoreRequestBtn.addEventListener("click", (e) => {
    e.preventDefault();
    const cursor = lastCursorFinder(".request-user", "request");
    generalDataLoader({
        url: `/api/v1/room/requestUser/${ruid}?cursor=${cursor}`,
        func: requestUserLoader,
    });
});

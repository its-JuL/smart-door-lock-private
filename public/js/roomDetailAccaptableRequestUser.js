const showMoreRequestBtn = document.querySelector("#request-show-more");
const giveAllAccessButton = document.getElementById("giveAllAccess");

const giveUserAccessAction = async (id, href) => {
    const pair = await setter({
        url: href,
        successMsg: "Success give access to user",
    });

    if (pair.success) {
        document.getElementById(`request-template-${id}`).remove();
        numberOfUserContainer.textContent =
            Number(numberOfUserContainer.textContent) + 1;
        numberOfRequestUserContainer.textContent =
            Number(numberOfRequestUserContainer.textContent) - 1;
        document.querySelector(".data-container").insertAdjacentHTML(
            "afterbegin",
            `<div
                class="accaptable-user d-flex mt-2 flex-column flex-sm-row justify-content-between align-items-md-center p-2 bg-neutral-7 rounded-5" id="card-id-${pair.data.card[0].card_number}" data-user-uuid=${pair.data.card[0].user.id}>
                <p class="text-neutral-1">${pair.data.card[0].card_name}@${pair.data.card[0].user.username}</p>
                <p class="text-neutral-2 bg-warning-2 p-1 rounded-10 pointer" onclick=deleteAccessHandler('${pair.data.card[0].card_number}') id="card-id-${pair.data.card[0].card_number}">Hapus akses</p>
            </div>`
        );
    }
};

const declineRoomRequest = async (id) => {
    const resp = await setter({
        url: `/api/v1/room/delete-room-request/?requestId=${id}`,
        method: "DELETE",
    });

    if (resp.success) {
        numberOfRequestUserContainer.textContent =
            Number(numberOfRequestUserContainer.textContent) - 1;
        document.getElementById(`request-template-${id}`).remove();
    }
};

const declineToggle = async (id, username) => {
    showAlertConfirm({
        theme: "warning",
        title: "Sure for decline?",
        desc: `Are you sure for decline ${username} room request`,
        link: "#",
        btn: "Delete",
        exec: () => declineRoomRequest(id),
    });
};

const requestUserTemplate = ({
    card: { card_number, card_name, user },
    id,
}) => {
    return `
    <div class="col-12 mt-3 request-user" data-request="${id}" id="request-template-${id}">
        <div
            class="d-flex flex-column flex-sm-row justify-content-between p-2 bg-neutral-7 rounded-5">
            <p class="text-neutral-2">
                ${card_name}@${user?.username || "Not paired"}
            </p>
            <div class="d-flex">
                <p class="text-neutral-1 pointer fw-bold request-link" onclick="giveUserAccessAction('${id}','/api/v2/room/pair?ruid=${ruid}&cardNumber=${card_number}&requestId=${id}')">Give Access</p>
                <p class="ms-2 pointer" 
                    onclick="declineToggle('${id}',
                    '${user?.username || "Not paired"}')">
                    Decline
                </p>
            </div>
        </div>
    </div>
    `;
};

const requestUserLoader = (data) => {
    if (data.length < 1) {
        giveAllAccessButton.textContent = "";
    }
    data.forEach((card) => {
        accessContainer.insertAdjacentHTML(
            "beforeend",
            requestUserTemplate(card)
        );
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

giveAllAccessButton.addEventListener("click", async (e) => {
    const resp = await setter({
        url: "/api/v1/room/grantAllAccess",
        method: "POST",
        body: {
            ruid,
        },
        successBody: "Refreshing the page",
    });

    if (resp.success) {
        setTimeout(() => {
            window.location = `/dashboard/room/detail/${ruid}`;
        }, 3500);
    }
});

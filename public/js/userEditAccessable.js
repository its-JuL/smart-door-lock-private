const accessableContainer = document.querySelector(".accessable-container");
const showMoreAccessableBtn = document.querySelector("#showMoreAccessable");

const deleteAccessHandler = (cardNumber, ruid) => {
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
                document.querySelector(`#room-id-${ruid}`).remove();
            }
        },
    });
};

const accessableItemTemplate = (data) => {
    return `
        <div id="room-id-${data.ruid}" class="table-row d-flex py-2 py-md-2 justify-content-around px-3 accessable--list-item" 
            data-id="${data.id}">
            <p class="table-data text-center text-neutral-2" data-ruid="${data.ruid}">
                ${data.name}
            </p>
            <p class="table-data text-center text-neutral-2 pointer" onclick="deleteAccessHandler('${data.card[0].card_number}','${data.ruid}')">
                <img src="/image/icon_delete.svg" alt="Delete" class="image">
            </p>
        </div>
    `;
};

const accessableLoader = (data) => {
    data.forEach((room) => {
        accessableContainer.insertAdjacentHTML(
            "beforeend",
            accessableItemTemplate(room)
        );
    });
};

generalDataLoader({
    url: `/api/v1/room/accesable/?username=${usernameContainerDetail.textContent}`,
    func: accessableLoader,
});

showMoreAccessableBtn.addEventListener("click", (e) => {
    e.preventDefault();
    const cursor = lastCursorFinder(".accessable--list-item", "id");
    generalDataLoader({
        url: `/api/v1/room/accesable/?username=${usernameContainerDetail.textContent}&cursor=${cursor}`,
        func: accessableLoader,
    });
});

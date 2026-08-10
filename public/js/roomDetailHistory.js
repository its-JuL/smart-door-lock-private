const logsBtn = document.querySelector("#logs");

const roomLogsTemplate = ({ Card, id, createdAt, isSuccess }) => {
    const cardName = Card?.user?.username
        ? Card?.card_name
            ? Card.card_name
            : "not identify"
        : Card.card_number;
    return `
    <div
        class="room-log d-flex mt-2 flex-column flex-sm-row justify-content-between p-2 bg-neutral-7 rounded-5" data-room-log=${id}>
        <p href="" class="text-neutral-1">${cardName}@${
        Card?.user?.username || "not found/not linked ⚠️"
    }</p>
        <a href="" class="text-neutral-2">${
            isSuccess ? "Berhasil " : "Gagal "
        }Mengakses ruangan pada    ${days(createdAt)}
        </a>
    </div>
    `;
};

const logsLoader = (data) => {
    data.forEach((card) => {
        itemContainer.insertAdjacentHTML("beforeend", roomLogsTemplate(card));
    });
};

logsBtn.addEventListener("click", () => {
    itemContainer.textContent = "";
    try {
        // document.querySelector(".ui-menu").remove();
        // document.querySelector(".ui-helper-hidden-accessible").remove();
    } catch (error) {}
    generalDataLoader({
        url: `/api/v1/room/logs/${ruid}`,
        func: logsLoader,
    });
    mode = "LOG";
    userBtn.classList.remove("active");
    logsBtn.classList.add("active");
    addCardForm.classList.add("d-none");
    searchCard.value = "";
});

showMoreBtn.addEventListener("click", (e) => {
    if (mode === "LOG") {
        const cursor = lastCursorFinder(".room-log", "room-log");
        generalDataLoader({
            url: `/api/v1/room/logs/${ruid}?cursor=${cursor}`,
            func: logsLoader,
        });
    }
    e.preventDefault();
});

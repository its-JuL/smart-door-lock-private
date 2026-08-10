const historyContainer = document.querySelector(".history-container");
const showMoreBtn = document.querySelector("#showMore");

const tableItemTemplate = (data) => {
    return `
        <div class="table-row d-flex py-2 py-md-2 justify-content-around px-3 history--list-item" data-id="${
            data.id
        }">
            <p class="table-data text-center text-neutral-2" data-id="">
                ${data.room.name}
            </p>
            <p class="table-data text-center text-neutral-2" data-key="">
                ${days(data.createdAt)}
            </p>
        </div>
    `;
};

const historyLoader = (data) => {
    data.forEach((history) => {
        historyContainer.insertAdjacentHTML(
            "beforeend",
            tableItemTemplate(history)
        );
    });
};

generalDataLoader({
    url: `/api/v1/card/history/${usernameContainerDetail.textContent}`,
    func: historyLoader,
});

showMoreBtn.addEventListener("click", (e) => {
    e.preventDefault();
    const cursor = lastCursorFinder(".history--list-item", "id");
    generalDataLoader({
        url: `/api/v1/card/history/${usernameContainerDetail.textContent}?cursor=${cursor}`,
        func: historyLoader,
    });
});

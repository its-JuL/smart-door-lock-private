const showMoreBtn = document.querySelector("#show-more");
const searchForm = document.querySelector("#search");
const searchbBn = document.querySelector("#search-btn");
const dataContainer = document.querySelector(".data-container");
const cardStatus = document.querySelectorAll(".card-status");
let viewState = "UNPAIR";
const deleteFunction = async ({ url, element }) => {
    const resp = await fetch(url, {
        method: "DELETE",
    });

    if (resp.ok) {
        showToast({
            theme: "success",
            title: "Success delete card",
            desc: "Successfully delete card",
        });
        document.querySelector(`#action-${element}`).remove();
    }

    if (!resp.ok) {
        showToast({
            theme: "danger",
            title: "Failed delete card",
            desc: "Failed to delete card",
        });
    }
};

const deleteHandler = (id) => {
    showAlertConfirm({
        theme: "danger",
        title: "Sure for delete?",
        desc: `Are you sure you want to delete this card ${id}`,
        link: "#",
        btn: "Delete",
        exec: () =>
            deleteFunction({ url: `/api/v1/card/delete/${id}`, element: id }),
    });
};

const unpairFunction = async ({ url, element }) => {
    const resp = await setter({
        url: "/api/v1/card/unpair",
        body: { cardNumber: element },
        successMsg: "Success unpair card",
        failedMsg: "Failed unpair card",
    });

    if (resp.success) {
        document.querySelector(`#action-${element}`).remove();
    }
};

const unpairHandler = (id) => {
    showAlertConfirm({
        theme: "warning",
        title: "Sure for unpair?",
        desc: `Are you sure you want to unpair this card ${id}`,
        link: "#",
        btn: "Unpair",
        exec: () => unpairFunction({ url: ``, element: id }),
    });
};

const cardTemplate = (data) => {
    return `
    <div class="table-row d-flex py-2 py-md-2 justify-content-between px-3 card--list-item" id="action-${
        data.card_number
    }" data-id="${data.id}">
        <span class="table-data text-center text-neutral-2">${
            data.card_number
        }</span>
        <p class="table-data text-center text-neutral-2">
            ${days(data.createdAt)} WIB</p>
        <p class=" table-data text-center text-neutral-2 text-danger-1 pointer" onclick="deleteHandler('${
            data.card_number
        }')">
            Delete
        </p>
        <a class="table-data pointer text-center d-flex justify-content-around pointer" href="/dashboard/card/pair/?cardId=${
            data.card_number
        }">
            Pair to User
        </a>
    </div>
    `;
};

const cardListLoader = (datas) => {
    datas.forEach((data) => {
        const apiLength = document.querySelectorAll(".card--list-item");
        dataContainer.insertAdjacentHTML("beforeend", cardTemplate(data));
    });
};

const unpairCardTemplate = (data) => {
    return `
    <div class="table-row d-flex py-2 py-md-2 justify-content-between px-3 card--list-item align-items-center" id="action-${
        data.card_number
    }" data-id="${data.id}">
        <span class="table-data text-center text-neutral-2">${
            data.card_number
        }<br>${data?.user?.username || "NOT LINKED ⚠️"}</span>
        <p class="table-data text-center text-neutral-2">
            ${days(data.createdAt)} WIB</p>
        <div class="table-data d-flex justify-content-center">
            <p class="hover-tool" data-hover="Delete Card" 
            onclick="deleteHandler('${data.card_number}')">
                <img src="/image/icon_delete.svg" alt="Delete" class="image pointer me-2">
            </p>
            <a class="text-center text-neutral-2 text-danger-1 pointer hover-tool"
                data-hover="Detail Card"
                href="/dashboard/card/detail/${data.card_number}">
                <img src="/image/icon_info.svg" alt="Info" class="image pointer"> 
            </a>
        </div>
        <p class="table-data pointer text-blue-3 text-center d-flex justify-content-around pointer" onclick="unpairHandler('${
            data.card_number
        }')">
            Unpair
        </p>
    </div>
    `;
};

const unpairCardListLoader = (datas) => {
    datas.forEach((data) => {
        const apiLength = document.querySelectorAll(".card--list-item");
        dataContainer.insertAdjacentHTML("beforeend", unpairCardTemplate(data));
    });
};

cardStatus.forEach((status) => {
    status.addEventListener("click", () => {
        cardStatus.forEach((status) => {
            status.classList.remove("card-active");
        });
        status.classList.add("card-active");
        viewState = status.getAttribute("data-status");

        dataContainer.textContent = "";
        if (viewState === "PAIR") {
            generalDataLoader({
                url: `/api/v1/card/unavailable`,
                func: unpairCardListLoader,
            });
        }

        if (viewState === "UNPAIR") {
            generalDataLoader({
                url: `/api/v1/card/available`,
                func: cardListLoader,
            });
        }
    });
});

showMoreBtn.addEventListener("click", (e) => {
    e.preventDefault();
    const cursor = lastCursorFinder(".card--list-item", "id");
    const search = searchForm.value;
    if (viewState === "UNPAIR") {
        if (search.length === 0) {
            generalDataLoader({
                url: `/api/v1/card/available?cursor=${cursor}`,
                func: cardListLoader,
            });
        }
        if (search.length > 0) {
            generalDataLoader({
                url: `/api/v1/card/available?cursor=${cursor}&search=${search}`,
                func: cardListLoader,
            });
        }
    }
    if (viewState === "PAIR") {
        if (search.length === 0) {
            generalDataLoader({
                url: `/api/v1/card/unavailable?cursor=${cursor}`,
                func: unpairCardListLoader,
            });
        }
        if (search.length > 0) {
            generalDataLoader({
                url: `/api/v1/card/unavailable?cursor=${cursor}&search=${search}`,
                func: unpairCardListLoader,
            });
        }
    }
});

searchbBn.addEventListener("click", (e) => {
    e.preventDefault();
    const search = searchForm.value;
    dataContainer.textContent = "";
    if (viewState === "UNPAIR") {
        generalDataLoader({
            url: `/api/v1/card/available?search=${search}`,
            func: cardListLoader,
        });
    }
    if (viewState === "PAIR") {
        generalDataLoader({
            url: `/api/v1/card/unavailable?search=${search}`,
            func: unpairCardListLoader,
        });
    }
});

showFlashToast();

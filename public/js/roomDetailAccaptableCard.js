const userBtn = document.querySelector("#user-btn");
let addBtn = document.getElementById("addBtn");
let newCardNumber;

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
                numberOfUserContainer.textContent =
                    Number(numberOfUserContainer.textContent) - 1;
            }
        },
    });
};

const accaptableUserTemplate = ({ card_name, user, id, card_number }) => {
    return `
    <div
        class="accaptable-user d-flex mt-2 flex-column flex-sm-row justify-content-between align-items-md-center p-2 bg-neutral-7 rounded-5" id="card-id-${card_number}" data-user-uuid=${id}>
        <p href="" class="text-neutral-1">
            ${card_name}@${user?.username || "Not have user"}
        </p>
        <p class="text-neutral-2 bg-warning-2 p-1 rounded-10 pointer" onclick=deleteAccessHandler('${card_number}')>Hapus akses</p>
    </div>
    `;
};

const formTemplate = () => {
    return `
        <form class="d-flex justify-content-between">
            <input type="text" class="bg-neutral-4 me-3 py-1 px-2 rounded-10" id="searchCard">
            <button type="button" class="p-1 rounded-10 bg-blue-1 text-center fw-bold" id="addBtn">Add</button>
        </form>
    `;
};

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

userBtn.addEventListener("click", () => {
    itemContainer.textContent = "";
    // itemContainer.insertAdjacentHTML("beforeend", formTemplate());
    generalDataLoader({
        url: `/api/v1/room/accaptable-user/${ruid}`,
        func: accaptableUserLoader,
    });
    mode = "USER";
    logsBtn.classList.remove("active");
    userBtn.classList.add("active");
    addCardForm.classList.remove("d-none");
});

showMoreBtn.addEventListener("click", (e) => {
    if (mode === "USER") {
        const cursor = lastCursorFinder(".accaptable-user", "user-uuid");
        generalDataLoader({
            url: `/api/v1/room/accaptable-user/${ruid}?cursor=${cursor}`,
            func: accaptableUserLoader,
        });
    }
    e.preventDefault();
});

$("body").on("click", "#searchCard", function () {
    $(this).autocomplete({
        source: "/api/v1/card/autocomplate",
        minLength: 1,
        select: function (event, ui) {
            //update input with selection
            event.preventDefault();
            $(event.target).val(ui.item.label);
            newCardNumber = ui.item.value;
            searchCard.setAttribute("data-cardNumber", newCardNumber);
        },
    });
});

document.getElementById("addBtn").addEventListener("click", async (e) => {
    e.preventDefault();
    const resp = await setter({
        url: "/api/v1/card/add-access-card-to-room",
        body: {
            ruid,
            cardNumber: newCardNumber,
        },
    });

    if (resp.success) {
        numberOfUserContainer.textContent =
            Number(numberOfUserContainer.textContent) + 1;
        document.querySelector("#searchCard").value = "";
        document
            .querySelector(".data-container")
            .insertAdjacentHTML(
                "afterbegin",
                accaptableUserTemplate(resp.data)
            );
    }
});

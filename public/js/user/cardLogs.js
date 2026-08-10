// startLoader();
const form = document.querySelector("form");
const cardIdContainer = document.querySelector(".card-id");
const cardNumber = cardIdContainer.getAttribute("data-card");
const cardTypeForm = document.querySelector("#card-type");
const cardIcon = document.querySelector(".card-icon");
const cardLogs = document.querySelector(".log-container");
const saveBtn = document.querySelector("#save-change");
const loadMoreBtn = document.querySelector("#load-more");
const authTypeForm = document.querySelector("#auth-type");
const formCardName = form.cardName;

const logsTemplate = ({ createdAt, name, number, id, status }) => {
    return `
    <div class="log-info row p-2" data-cursor=${id}>
        <div class="col-3">
            <p class="fw-bold text-neutral-2">${number}</p>
        </div>
        <div class="col-3">
            <p class="fw-bold text-neutral-2">${name}</p>
        </div>
        <div class="col-3">
            <p class="fw-bold text-neutral-2">${days(createdAt)} WIB</p>
        </div>
        <div class="col-3">
            <p class="fw-bold text-neutral-2">${status}</p>
        </div>
    </div>
    `;
};

// INFO: Basic Info Loader
const basicInfoLoader = (data) => {
    const { card_number, card_name, type, isTwoStepAuth } = data.info;
    form.cardNumber.value = card_number;
    form.cardName.value = card_name;
    for (let index = 0; index < cardTypeForm.length; index++) {
        if (cardTypeForm.options[index].value === type) {
            cardTypeForm.options.selectedIndex = index;
        }
    }
    authTypeForm.checked = isTwoStepAuth;
    cardIcon.setAttribute("src", `/image/icon_${type}.svg`);
};

const basicInfoErrHandler = (err) => {
    closeLoader();
    showToast({
        theme: "danger",
        title: "Failed to load data",
        desc: err,
    });
};

generalDataLoader({
    url: `/api/v1/card/u/${cardNumber}`,
    func: basicInfoLoader,
    errHandler: basicInfoErrHandler,
});

// INFO: Fetch logs data
const cardLogsLoader = (data) => {
    let number = document.querySelectorAll(".log-info").length + 1;
    data.forEach((log) => {
        const {
            createdAt,

            room: { name },
            Card: { card_name },
            id,
            isSuccess,
        } = log;
        const status = isSuccess ? "Success" : "Failed";
        cardLogs.insertAdjacentHTML(
            "beforeend",
            logsTemplate({ createdAt, name, number, id, status })
        );
        number++;
    });
};

const cardLogsLoaderMore = (data) => {
    let number = document.querySelectorAll(".log-info").length + 1;
    if (data.length === 0) {
        showAlert({
            theme: "warning",
            title: "Data already load",
            desc: "You have loaded all the data",
        });
    }
    data.forEach((log) => {
        const {
            createdAt,
            room: { name },
            id,
            isSuccess,
        } = log;
        const status = isSuccess ? "Success" : "Failed";
        cardLogs.insertAdjacentHTML(
            "beforeend",
            logsTemplate({ createdAt, name, id, number, status })
        );
        number++;
    });
};

generalDataLoader({
    url: `/api/v1/card/u/logs/${cardNumber}`,
    func: cardLogsLoader,
});

loadMoreBtn.addEventListener("click", () => {
    const cursor = lastCursorFinder(".log-info", "cursor");
    generalDataLoader({
        url: `/api/v1/card/u/logs/${cardNumber}/?cursor=${cursor}`,
        func: cardLogsLoaderMore,
    });
});

// INFO: Change card info
saveBtn.addEventListener("click", async () => {
    const cardName = formCardName.value;
    const cardType = cardTypeForm.value;
    const isTwoStepAuth = String(authTypeForm.checked);
    const updateCardData = await setter({
        url: `/api/v1/card/update/${cardNumber}`,
        body: {
            cardName,
            cardType,
            isTwoStepAuth,
        },
        successMsg: "Succes updated card",
    });

    if (updateCardData.success === true) {
        cardIcon.setAttribute(
            "src",
            `/image/icon_${updateCardData.data.type}.svg`
        );
        cardIdContainer.textContent = `${updateCardData.data.card_name} | Details`;
    }
});

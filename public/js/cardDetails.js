const form = document.querySelector("form");
const cardTypeForm = document.querySelector("#card-type");
const authTypeForm = document.querySelector("#auth-type");
const cardBannedStatus = document.querySelector("#banned-card");
const cardIdContainer = document.querySelector(".card-id");
const cardNumber = cardIdContainer.getAttribute("data-card");
const cardIcon = document.querySelector(".card-image");
const username = document.getElementById("username");
const saveBtn = document.querySelector("#save-change");

// INFO: Basic Info Loader
const basicInfoLoader = (data) => {
    const { card_number, card_name, type, isTwoStepAuth, banned } = data;
    form.cardNumber.value = card_number;
    form.cardName.value = card_name;
    username.value = data?.user?.username || "NOT LINKED ⚠️";
    for (let index = 0; index < cardTypeForm.length; index++) {
        if (cardTypeForm.options[index].value === type) {
            cardTypeForm.options.selectedIndex = index;
        }
    }
    authTypeForm.checked = isTwoStepAuth;
    cardBannedStatus.checked = banned;
    cardIcon.setAttribute("src", `/image/icon_${type}.svg`);
};

generalDataLoader({
    url: `/api/v1/card/detail/${cardNumber}`,
    func: basicInfoLoader,
});

// INFO: Change card info
saveBtn.addEventListener("click", async (e) => {
    e.preventDefault();
    const cardName = form.cardName.value;
    const cardType = cardTypeForm.value;
    const isTwoStepAuth = String(authTypeForm.checked);
    const cardBannedStatusForm = String(cardBannedStatus.checked);
    const updateCardData = await setter({
        url: `/api/v1/card/admin-modify-card/${cardNumber}`,
        body: {
            cardName,
            cardType,
            isTwoStepAuth,
            cardBannedStatus: cardBannedStatusForm,
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

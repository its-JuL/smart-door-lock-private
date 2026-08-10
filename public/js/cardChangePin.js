const cardIDContainer = document.querySelector("#card-id");
const cardNameContainer = document.querySelector("#card-name");
const cardPinMatchContainer = document.querySelector("#is-new-pin-match");
const cardNumber = cardIDContainer.getAttribute("data-id");
const cardIcon = document.querySelector(".card-icon");
const form = document.querySelector("form");
const btn = document.querySelector("#save");

// INFO: Basic Info Loader
const basicInfoLoader = (data) => {
    cardNameContainer.value = data.card_name;
    cardIDContainer.textContent = `Card ID: ${data.id} || Card Number: ${data.card_number}`;
    cardIcon.setAttribute("src", `/image/icon_${data.type}.svg`);
};

generalDataLoader({
    url: `/api/v1/card/detail/${cardNumber}`,
    func: basicInfoLoader,
});

form.confirmPin.addEventListener("keyup", (e) => {
    const newPin = form.newPin.value;
    const confirmNewPin = form.confirmPin.value;

    if (newPin !== confirmNewPin) {
        cardPinMatchContainer.textContent = "New Pin Doesn't Match";
        btn.disabled = true;
    } else {
        cardPinMatchContainer.textContent = " ";
        btn.disabled = false;
    }
});

btn.addEventListener("click", async (e) => {
    e.preventDefault();
    const newPin = form.newPin.value;
    const confirmNewPin = form.confirmPin.value;
    const changePin = await setter({
        url: `/api/v1/card//admin-change-pin/${cardNumber}`,
        body: { newPin, confirmNewPin },
        successMsg: "Success Change Pin",
    });
    if (changePin.success) {
        setTimeout(() => {
            return (window.location = `/dashboard/card/detail/${cardNumber}`);
        }, 3500);
    }
});

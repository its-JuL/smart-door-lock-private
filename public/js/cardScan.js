const nrfStatus = document.querySelector("#nrf-status");
const formStatus = document.querySelector("#form-status");
const cardNumberForm = document.querySelector("#card-number");
const saveBtn = document.querySelector("#save-card");
const authTypeForm = document.querySelector("#auth-type");
if ("NDEFReader" in window) {
    formStatus.classList.add("d-flex");
} else {
    nrfStatus.classList.remove("d-none");
    formStatus.classList.add("d-none");
}

const startScanning = async () => {
    try {
        const ndef = new NDEFReader();
        await ndef.scan();

        ndef.addEventListener("readingerror", (error) => {
            showAlert({
                theme: "warning",
                title: "Can't read card data",
                desc: "We are sorry, your card not supported yet. Please try another card!",
            });
        });

        ndef.addEventListener("reading", (data) => {
            const { message, serialNumber } = data;
            cardNumberForm.value = serialNumber.replaceAll(":", "");
        });
    } catch (error) {
        showAlert({
            theme: "warning",
            title: "Cant activate this feature",
            desc: error,
        });
    }
};

const askPermission = async () => {
    const nfcPermissionStatus = await navigator.permissions.query({
        name: "nfc",
    });
    if (nfcPermissionStatus.state === "granted") {
        document.querySelector(".permission").classList.add("d-none");
        startScanning();
    } else {
        document.querySelector(".permission").addEventListener("click", () => {
            startScanning();
        });
    }
};
askPermission();

document.querySelector(".clear-toggle").addEventListener("click", () => {
    cardNumberForm.value = "";
});

saveBtn.addEventListener("click", (e) => {
    e.preventDefault;
    const pin = document.querySelector("#card-pin").value;
    const cardNumber = cardNumberForm.value;
    const isTwoStepAuth = authTypeForm.checked;
    setter({
        url: "/api/v1/card/register",
        body: { pin, cardNumber, isTwoStepAuth },
    });
});

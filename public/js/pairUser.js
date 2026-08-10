const form = document.querySelector("form");
const cardId = document.querySelector("#card-id");
const btn = document.querySelector("#pairButton");
const pairButtonn = document.querySelector("#pairButton");
const cardCreationTime = document.querySelector("#cardCreationTime");

$("#username").autocomplete({
    source: "/api/v1/user/autocomplete",
    select: function (event, ui) {
        event.preventDefault();
        document.querySelector("#username").value = ui.item.label;
        document.querySelector("#uid").textContent = ui.item.value;
    },
});

btn.addEventListener("click", async (e) => {
    startLoader();
    e.preventDefault();
    const username = form.username.value;
    const cardValue = cardId.getAttribute("data-card");
    try {
        const res = await fetch("/api/v1/user/pair", {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
            },
            body: JSON.stringify({
                username: username,
                cardNumber: cardValue,
            }),
        })
            .then((res) => {
                if (!res.ok) throw res.json();
                return res.json();
            })
            .then(() => {
                closeLoader();
                setToast({
                    status: "success",
                    title: "Berhasil Pairing",
                    msg: "Berhasil menautkan user dan kartu",
                });
                window.location = "/dashboard/card/list";
            });
    } catch (error) {
        closeLoader();
        const err = await error;
        showToast({
            theme: "danger",
            title: "Failed to pairing",
            desc: err.message || "Failed to pairing user and card",
        });
    }
});

const cardInfo = async () => {
    const resp = await fetcher(
        `/api/v1/card/detail/${cardId.textContent.replaceAll(" ", "")}`
    );

    if (!resp.success) {
        showToast({
            theme: "danger",
            title: "Cant Find Card",
            desc: "Cant find card detail information",
        });
    }
    if (resp.success) {
        cardCreationTime.textContent = days(resp.data.createdAt);
    }
};

cardInfo();

const logsBtn = document.querySelector("#logs");

const authenticationMethodLabels = {
    RFID: "RFID",
    FINGERPRINT: "Fingerprint",
    PIN: "PIN",
    FACE: "Face Recognition",
    EXIT_BUTTON: "Tombol Keluar",
    UNKNOWN: "Tidak diketahui",
};

const roomLogsTemplate = ({ Card, user, id, createdAt, isSuccess, authenticationMethod }) => {
    const recordUser = user || Card?.user;
    const userName = recordUser?.profil?.full_name || recordUser?.username || "Tidak teridentifikasi";
    const method = authenticationMethodLabels[authenticationMethod] || "Tidak diketahui";
    return `
    <div
        class="room-log d-flex mt-2 flex-column flex-sm-row justify-content-between p-2 bg-neutral-7 rounded-5" data-room-log=${id}>
        <p class="text-neutral-1 mb-1 mb-sm-0">${userName}</p>
        <p class="text-neutral-2 mb-1 mb-sm-0">Metode: ${method}</p>
        <p class="text-neutral-2 mb-0">${
            isSuccess ? "Berhasil" : "Gagal"
        } · ${days(createdAt)}</p>
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

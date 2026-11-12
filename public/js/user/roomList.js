const requestRoom = async (button) => {
    const cardSelector = document.querySelector("#request-card");
    const cardNumber = cardSelector ? cardSelector.value : "";

    if (!cardNumber) {
        showAlert({
            theme: "danger",
            title: "Kartu tidak ditemukan",
            desc: "Daftarkan kartu terlebih dahulu melalui operator.",
        });
        return;
    }

    button.disabled = true;
    startLoader();

    try {
        const response = await fetch(
            `/api/v1/room/u/request?ruid=${encodeURIComponent(
                button.dataset.ruid
            )}&cardNumber=${encodeURIComponent(cardNumber)}`,
            {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                },
            }
        );
        const result = await response.json();
        closeLoader();

        if (result.success) {
            showToast({
                theme: "success",
                title: "Permintaan terkirim",
                desc: "Permintaan akses ruangan menunggu persetujuan operator.",
            });
            button.outerHTML =
                '<p class="text-neutral-2 fst-italic mb-0">Menunggu</p>';
            return;
        }

        button.disabled = false;
        showAlert({
            theme: "danger",
            title: "Permintaan gagal",
            desc: result.message || "Permintaan akses ruangan tidak dapat diproses.",
        });
    } catch (error) {
        closeLoader();
        button.disabled = false;
        showAlert({
            theme: "danger",
            title: "Koneksi bermasalah",
            desc: "Permintaan akses ruangan tidak dapat dikirim. Coba lagi.",
        });
    }
};

document.querySelectorAll(".request-room-btn").forEach((button) => {
    button.addEventListener("click", () => requestRoom(button));
});

const toastTemplate = (title, desc, color, icon) => {
    return `
        <div class="toastNotif--color ${color}2 rounded-13 me-1 me-sm-3"></div>
        <div class="toastMsg d-flex align-items-center me-2 me-sm-5">
            <img src="${icon}" alt="" class="toast--icon me-2">
            <div>
                <h5 class="fw-bold">${title}</h5>
                <p>${desc}</p>
            </div>
        </div>
        <img src="/image/icon_x.svg" alt="" class="toast--icon-close">
    `;
};
let closeToast;

const showToast = ({ theme, desc, title }) => {
    const icons = {
        success: "/image/icon_success.svg",
        warning: "/image/icon_warning.svg",
        danger: "/image/icon_error.svg",
    };

    const colors = {
        success: "bg-success-",
        warning: "bg-warning-",
        danger: "bg-danger-",
    };

    const div = document.createElement("div");
    div.classList.add(
        "toastNotif",
        "d-flex",
        "justify-content-end",
        "align-items-start",
        "bg-neutral-7",
        "shadow-c-1",
        "p-2",
        "rounded-13"
    );

    div.insertAdjacentHTML(
        "afterbegin",
        toastTemplate(title, desc, colors[theme], icons[theme])
    );
    notifyContainer.appendChild(div);
    const activateToast = () => {
        div.classList.add("active");
    };
    setTimeout(() => {
        activateToast();
        closeToast = document.querySelectorAll(".toast--icon-close");
        closeToast.forEach((toast) => {
            toast.addEventListener("click", () => {
                toast.parentElement.classList.remove("active");
            });
        });
    }, 500);
};

/*
showToast({
    theme: "success",
    title: "Berhasil pairing",
    desc: "Berhasil menautkan user dan card",
});

showToast({
    theme: "warning",
    title: "Gagal pairing",
    desc: "Berhasil menautkan user dan card",
});

showToast({
    theme: "danger",
    title: "Internal error",
    desc: "Berhasil menautkan user dan card",
});
*/

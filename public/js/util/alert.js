const notifyContainer = document.querySelector("body");
let closeAlert;
const alertTemplate = (icon, title, desc, color) => {
    return `
        <div class="alert--icon ${color}2 p-4 ro rounded-13">
            <img src="${icon}" alt="">
        </div>
        <h3 class="fw-bold mt-4">${title}</h3>
        <p class="mt-2">${desc}</p>
        <p class="mt-5 mb-4 shadow-c-1 fw-bolder text-neutral-7 btn ${color}1 py-2 px-4 rounded-13 close-alert">Done</p>
    `;
};

const alertConfirmTemplate = (icon, title, desc, color, link, btn) => {
    return `
        <div class="alert--icon ${color}2 p-4 ro rounded-13">
            <img src="${icon}" alt="">
        </div>
        <h3 class="fw-bold mt-4">${title}</h3>
        <p class="mt-2">${desc}</p>
        <div>
            <a class="mt-5 mb-4 shadow-c-1 fw-bolder text-neutral-7 btn ${color}2 py-2 px-4 rounded-13 link" data-link="${link}" href=${link}>${
        btn || "Done"
    }</a>
            <p class="ms-3 mt-5 mb-4 shadow-c-1 fw-bolder text-neutral-7 btn ${color}1 py-2 px-4 rounded-13 close-alert">Cancel</p>
        </div>
    `;
};

const showAlert = ({ theme, title, desc }) => {
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
        "alert",
        "shadow-c-1",
        "d-flex",
        "flex-column",
        "align-items-center",
        "bg-neutral-7",
        "p-3",
        "rounded-13"
    );
    div.insertAdjacentHTML(
        "afterbegin",
        alertTemplate(icons[theme], title, desc, colors[theme])
    );
    notifyContainer.appendChild(div);
    const activateAlert = () => {
        div.classList.add("active");
    };

    const deActivateAlert = () => {
        div.classList.remove("active");
    };

    setTimeout(() => {
        activateAlert();
        closeAlert = document.querySelectorAll(".close-alert");
        closeAlert.forEach((item) => {
            item.addEventListener("click", (e) => {
                e.preventDefault();
                item.parentElement.classList.remove("active");
            });
        });
    }, 500);
};

const showAlertConfirm = ({ theme, title, desc, link, exec, btn }) => {
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
        "alert",
        "shadow-c-1",
        "d-flex",
        "flex-column",
        "align-items-center",
        "bg-neutral-7",
        "p-3",
        "rounded-13"
    );
    div.insertAdjacentHTML(
        "afterbegin",
        alertConfirmTemplate(
            icons[theme],
            title,
            desc,
            colors[theme],
            link,
            btn
        )
    );
    notifyContainer.appendChild(div);
    const activateAlert = () => {
        div.classList.add("active");
    };

    const deActivateAlert = () => {
        div.classList.remove("active");
    };

    // exec
    const tergetLink = document.querySelectorAll(".link");
    tergetLink.forEach((d) => {
        const href = d.getAttribute("data-link");
        if (href === "#") {
            d.addEventListener("click", (e) => {
                e.preventDefault();
                exec();
                d.parentElement.parentElement.classList.remove("active");
                setTimeout(() => {
                    div.remove();
                }, 500);
                return true;
            });
        }
    });

    setTimeout(() => {
        activateAlert();
        closeAlert = document.querySelectorAll(".close-alert");
        closeAlert.forEach((item) => {
            item.addEventListener("click", (e) => {
                e.preventDefault();
                item.parentElement.parentElement.classList.remove("active");
                setTimeout(() => {
                    div.remove();
                }, 500);
                return false;
            });
        });
    }, 200);
};

// showAlert({
//     theme: "success",
//     title: "successfully pair user",
//     desc: "User and card successfuly paired",
// });

// showAlert({
//     theme: "danger",
//     title: "successfully pair user",
//     desc: "User and card successfuly paired",
// });

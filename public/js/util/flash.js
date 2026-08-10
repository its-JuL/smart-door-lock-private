const setToast = ({ status, title, msg }) => {
    Cookies.set("toast", status);
    Cookies.set("toastTitle", title);
    Cookies.set("toastMsg", msg);
};

const getToast = () => {
    const status = Cookies.get("toast");
    const title = Cookies.get("toastTitle");
    const msg = Cookies.get("toastMsg");
    return { status, title, msg };
};

const showFlashToast = () => {
    const { status, title, msg } = getToast();
    if (status) {
        setTimeout(() => {
            showToast({
                theme: status,
                title: title,
                desc: msg,
            });
        }, 300);
        setTimeout(() => {
            Cookies.remove("toast");
            Cookies.remove("toastTitle");
            Cookies.remove("toastMsg");
        }, 1000);
    }
};

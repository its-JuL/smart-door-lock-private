const notify = document.querySelector(".notify");
const loading = document.querySelector("#loading");

const showNotify = () => {
    notify.classList.add("active");
};

const closeNotify = () => {
    notify.classList.remove("active");
};

const showLoading = () => {
    loading.classList.add("active");
};

const closeLoading = () => {
    loading.classList.remove("active");
};

const startLoader = () => {
    showNotify();
    showLoading();
};

const closeLoader = () => {
    closeNotify();
    closeLoading();
};

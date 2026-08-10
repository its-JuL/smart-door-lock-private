const copys = document.querySelectorAll(".copy");
const showMoreBtn = document.querySelector("#showMore");
const apiForm = document.querySelector("#api");
const apiContainer = document.querySelector(".api-container");
const searchBtn = document.querySelector("#search-button");
const generateBtn = document.querySelector("#generate-button");
let showMoreCount = 0;

const copyHandler = (id, secret) => {
    const copyText = `?id=${id}&secret=${secret}`;
    navigator.clipboard.writeText(copyText);
    const copy = document.querySelector(`#copy-${id}`);
    copy.parentElement.parentNode.children[3].children[1].setAttribute(
        "data-hover",
        "Copy to your clipboard"
    );

    copy.addEventListener("mouseleave", () => {
        copy.parentElement.parentNode.children[3].children[1].setAttribute(
            "data-hover",
            "Copy"
        );
    });
};

const deleteAction = ({ url, element }) => {
    startLoader();

    fetch(url, {
        method: "DELETE",
    })
        .then((res) => {
            if (!res.ok) throw "Something wrong";
            return res.json();
        })
        .then((data) => {
            closeLoader();
            showToast({
                theme: "success",
                title: "Action complate",
                desc: `Success to delete API`,
            });
            element.remove();
        })
        .catch((e) => {
            closeLoader();
            showToast({
                theme: "danger",
                title: "Action failed",
                desc: "Failed to delete API",
            });
        });
};

const deleteToggle = (id, apiName) => {
    const url = `/api/v1/api-management/delete/${id}`;
    const element = document.getElementById("api-template-" + id);
    showAlertConfirm({
        theme: "danger",
        title: "Delete confirmation!",
        desc: `Are you sure you want to delete the ${apiName}`,
        link: "#",
        btn: "Delete",
        exec: () => deleteAction({ url, element }),
    });
};

const apiTemplate = (data, no) => {
    return `
        <div class="table-row d-flex py-2 py-md-2 justify-content-between px-3 api--list-item" data-id="${data.id}" id="api-template-${data.id}">
            <span class="table-data text-center text-neutral-2"> ${no} </span>
            <p class="table-data text-center text-neutral-2" data-id="${data.id}">
                ${data.id}</p>
            <p class="table-data text-center text-neutral-2" data-key="${data.secret}">
                ${data.secret}</p>
            <div class="table-data pointer d-flex justify-content-around">
                <span class="hover-tool" data-hover="Delete">
                    <img src="/image/icon_delete.svg" alt="Delete" class="image" onclick="deleteToggle('${data.id}','${data.id}')">
                </span>

                <span class="hover-tool copy" id="copy-${data.id}" data-hover="Copy" onclick=copyHandler("${data.id}","${data.secret}")>
                    <img src="/image/icon_copy.svg" alt="Copy" class="image">
                </span>
            </div>
        </div>
    `;
};

const apiFirtsLoader = (data) => {
    data.forEach((api, id) => {
        const apiLength = document.querySelectorAll(".api--list-item");
        apiContainer.insertAdjacentHTML(
            "beforeend",
            apiTemplate(api, apiLength.length + 1)
        );
    });
};

const apiListLoader = (data) => {
    data.forEach((api, id) => {
        const apiLength = document.querySelectorAll(".api--list-item");
        apiContainer.insertAdjacentHTML(
            "beforeend",
            apiTemplate(api, apiLength.length + 1)
        );
    });
};

showMoreBtn.addEventListener("click", (e) => {
    e.preventDefault();
    const cursor = lastCursorFinder(".api--list-item", "id");
    const search = apiForm.value;
    if (search.length === 0) {
        generalDataLoader({
            url: `/api/v1/api-management/list/?cursor=${cursor}`,
            func: apiListLoader,
        });
    }
    if (search.length > 0) {
        generalDataLoader({
            url: `/api/v1/api-management/list/?cursor=${cursor}&search=${search}`,
            func: apiListLoader,
        });
    }
});

searchBtn.addEventListener("click", (e) => {
    e.preventDefault();
    const search = apiForm.value;
    apiContainer.textContent = " ";
    generalDataLoader({
        url: `/api/v1/api-management/list?search=${search}`,
        func: apiFirtsLoader,
    });
});

generateBtn.addEventListener("click", async (e) => {
    e.preventDefault();
    const resp = await setter({
        url: "/api/v1/api-management/generate",
        successMsg: "Success generate API",
        successBody: "Please click show more to see new api",
    });

    if (resp.success) {
        const apiLength = document.querySelectorAll(".api--list-item");
        apiContainer.insertAdjacentHTML(
            "beforeend",
            apiTemplate(resp.data, apiLength.length + 1)
        );
    }
});

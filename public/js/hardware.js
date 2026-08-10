const showMoreBtn = document.querySelector("#showMore");
const hwForm = document.querySelector("#hw");
const hwContainer = document.querySelector(".hw-container");
const searhcBtn = document.querySelector(".input-group-prepend");

const del = ({ url, element }) => {
    startLoader();

    fetch(url, {
        method: "DELETE",
    })
        .then((res) => {
            if (!res.ok) throw res;
            return res.json();
        })
        .then((data) => {
            closeLoader();
            showToast({
                theme: "success",
                title: "Success action",
                desc: `Success to delete HARDWARE`,
            });
            element.remove();
        })
        .catch(async (e) => {
            closeLoader();
            const errors = await e.json();
            showToast({
                theme: "danger",
                title: "Failed to delete HARDWARE",
                desc: errors.message || "Failed action",
            });
        });
};

const deleteApi = ({ url, hw, element }) => {
    showAlertConfirm({
        theme: "danger",
        title: "Sure for delete?",
        desc: `Apakah anda yakin menghapus Hardware ${hw}`,
        link: "#",
        btn: "Delete",
        exec: () => del({ url, element }),
    });
};

const deleteHandler = (id, huid) => {
    const element = document.querySelector(`#hw-${id}`);
    element.addEventListener("click", (e) => {
        e.preventDefault();
        const url = `/api/v2/room/device/delete/${huid}`;
        deleteApi({ url, element, hw: huid });
    });
};

const hardwareTemplate = (data, id) => {
    return `
        <div class="table-row d-flex py-1 py-md-2 justify-content-between px-3 hardware--list-item" id="hw-${
            data.id
        }" data-id=${data.id}>
            <p class="table-data text-center text-neutral-2">${id}</p>
            <p class="table-data text-center text-neutral-2" data-id="${
                data.device_id
            }">
                ${data.device_id}</p>
            <p class="table-data text-center text-neutral-2">
                ${days(data.createdAt)} WIB</p>
            <div class="table-data pointer d-flex justify-content-around">
                <span class="hover-tool" data-hover="Delete" onclick='deleteHandler("${
                    data.id
                }", "${data.device_id}")'>
                    <img src="/image/icon_delete.svg" alt="Delete" class="image">
                </span>
            </div>
        </div>
    `;
};

const hardwareListLoader = (data) => {
    data.forEach((api) => {
        const apiLength = document.querySelectorAll(".hardware--list-item");
        hwContainer.insertAdjacentHTML(
            "beforeend",
            hardwareTemplate(api, apiLength.length + 1)
        );
    });
};

showMoreBtn.addEventListener("click", (e) => {
    e.preventDefault();
    const cursor = lastCursorFinder(".hardware--list-item", "id");
    const search = hwForm.value;
    if (search.length === 0) {
        generalDataLoader({
            url: `/api/v2/room/device/list?cursor=${cursor}`,
            func: hardwareListLoader,
        });
    }
    if (search.length > 0) {
        generalDataLoader({
            url: `/api/v2/room/device/list?cursor=${cursor}&search=${search}`,
            func: hardwareListLoader,
        });
    }
});

searhcBtn.addEventListener("click", (e) => {
    e.preventDefault();
    hwContainer.textContent = "";
    const search = hwForm.value;
    generalDataLoader({
        url: `/api/v2/room/device/list?search=${search}`,
        func: hardwareListLoader,
    });
});

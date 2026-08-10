const numberOfGatewayDevice = document.getElementById("numberOfGatewayDevice");
const countOfNodwWithMultiNetworkType = document.getElementById(
    "countOfNodwWithMultiNetworkType"
);
const gatewayList = document.getElementById("gatewayList");
const showMoreBtn = document.querySelector("#showMore");
const buildingForm = document.querySelector("#buildingForm");
const searchBtn = document.querySelector("#search");

const deleteAction = async (id) => {
    const element = document.getElementById("gateway-template-" + id);
    const resp = await setter({
        url: "/api/v1/gateway/device/delete",
        body: { gatewayShortId: id },
        method: "delete",
    });

    if (resp.success) {
        element.remove();
    }
};

const deleteToggle = (id, buildingName) => {
    showAlertConfirm({
        theme: "danger",
        title: "Delete confirmation!",
        desc: `Are you sure you want to delete the <b>"${buildingName}"</b> gateway device`,
        link: "#",
        btn: "Delete",
        exec: () => deleteAction(id),
    });
};

const gatewayDeviceListTemplate = (gateway) => {
    return `
    <div class="table-row d-flex py-2 py-md-2 justify-content-between px-3 gateway--list-item"
        data-id="${gateway.id}" 
        id="gateway-template-${gateway.gateway_short_id}">
        <span class="table-data text-center text-neutral-2">
            ${gateway.gateway_short_id}
        </span>
        <p class="table-data text-center text-neutral-2">
            ${days(gateway.lastOnline)}
        </p>
        <p class="table-data text-center text-neutral-2">
            ${days(gateway.createdAt)}
        </p>
        <div class="table-data pointer d-flex justify-content-center">
            <span class="hover-tool me-1 pointer" data-hover="Delete"
             onclick="deleteToggle('${gateway.gateway_short_id}',
                '${gateway.gateway_short_id}')">
                <img src="/image/icon_delete.svg" alt="Delete" class="image">
            </span>
        </div>
    </div>
    `;
};

const gatewayDeviceInformation = (data) => {
    numberOfGatewayDevice.textContent = data.countOfGateway;
    countOfNodwWithMultiNetworkType.textContent =
        data.countOfNodwWithMultiNetworkType;

    data.gatewayList.forEach((gateway) => {
        gatewayList.insertAdjacentHTML(
            "beforeend",
            gatewayDeviceListTemplate(gateway)
        );
    });
};

const gatewayListLoader = (data) => {
    data.forEach((building) => {
        gatewayList.insertAdjacentHTML(
            "beforeend",
            gatewayDeviceListTemplate(building)
        );
    });
};

generalDataLoader({
    url: "/api/v1/gateway/device/general-information",
    func: gatewayDeviceInformation,
});

showMoreBtn.addEventListener("click", (e) => {
    e.preventDefault();
    const cursor = lastCursorFinder(".gateway--list-item", "id");
    const search = buildingForm.value;

    if (search.length > 0) {
        generalDataLoader({
            url: `/api/v1/gateway/device/list/?cursor=${cursor}&search=${search}`,
            func: gatewayListLoader,
        });
    }
    if (search.length === 0) {
        generalDataLoader({
            url: `/api/v1/gateway/device/list/?cursor=${cursor}`,
            func: gatewayListLoader,
        });
    }
});

searchBtn.addEventListener("click", (e) => {
    e.preventDefault();
    const search = buildingForm.value;
    gatewayList.textContent = "";
    generalDataLoader({
        url: `/api/v1/gateway/device/list/?search=${search}`,
        func: gatewayListLoader,
    });
});

const nodeAddButton = document.getElementById("nodeAddButton");
const gatewayAddButton = document.getElementById("gatewayAddButton");
const nodeList = document.getElementById("nodeList");
const gatewayList = document.getElementById("gatewayList");
const nodeCount = document.getElementById("linkedNodeCount");
const gatewayCount = document.getElementById("gatewayCount");
const saveButton = document.getElementById("save");
const gatewaySpotName = document.getElementById("gatewaySpotName");
const nodeDeviceIDs = new Set();
const gatewayShortID = new Set();

const removeTableItem = (element) => {
    if (element.startsWith("node")) {
        nodeDeviceIDs.delete(element.split("$")[1]);
        updateList(nodeDeviceIDs, "node");
    }
    if (element.startsWith("gateway")) {
        gatewayShortID.delete(element.split("$")[1]);
        updateList(gatewayShortID, "gateway");
    }
};

const tableItemTemplate = (data, ...name) => {
    return `
    <div class="table-row d-flex py-2 py-md-2 justify-content-between px-3" id="${data}">
        <p class="table-data text-center text-neutral-2">${
            name || data.split("$")[1]
        }</p>
        <span class="table-data hover-tool me-1 pointer d-flex justify-content-center" 
            onclick = "removeTableItem('${data}')"
            data-hover="Delete">
            <img src="/image/icon_delete.svg" alt="Delete" class="image">
        </span>
    </div>
    `;
};

const updateList = (datas, type) => {
    if (type === "node") {
        nodeList.textContent = "";
        datas.forEach((data) => {
            nodeList.insertAdjacentHTML(
                "beforeend",
                tableItemTemplate(`${type}$${data}`, data)
            );
        });
        nodeCount.textContent = datas.size;
    }

    if (type === "gateway") {
        gatewayList.textContent = "";
        datas.forEach((data, key) => {
            gatewayList.insertAdjacentHTML(
                "beforeend",
                tableItemTemplate(`${type}$${key}`, data)
            );
        });
        gatewayCount.textContent = datas.size;
    }
};

$("#gatewayDevice").autocomplete({
    source: "/api/v1/gateway/device/autocomplate/",
    select: function (event, ui) {
        event.preventDefault();
        document.querySelector("#gatewayDevice").value = ui.item.label;
        document.querySelector("#gatewayID").value = ui.item.value;
    },
});

$("#duid-auto").autocomplete({
    source: "/api/v2/room/device/autocomplate?type=MULTI_NETWORK&",
    select: function (event, ui) {
        event.preventDefault();
        document.querySelector("#duid-auto").value = ui.item.label;
        document.querySelector("#device_Id").value = ui.item.label;
    },
});

nodeAddButton.addEventListener("click", (e) => {
    e.preventDefault();
    nodeDeviceIDs.add(document.querySelector("#device_Id").value);
    updateList(nodeDeviceIDs, "node");
});

gatewayAddButton.addEventListener("click", (e) => {
    e.preventDefault();
    if (gatewayShortID.size > 0) {
        showAlert({
            theme: "warning",
            title: "Cant add new gateway device",
            desc: "One gateway spot is only allowed to have one gateway device. Please remove the gateway device first.",
        });
        return;
    }
    gatewayShortID.add(document.querySelector("#gatewayDevice").value);
    updateList(gatewayShortID, "gateway");
});

saveButton.addEventListener("click", async (e) => {
    const resp = await setter({
        url: "/api/v1/gateway/link-to-device",
        body: {
            name: gatewaySpotName.value,
            gatewayShortId: Array.from(gatewayShortID)[0],
        },
    });

    if (resp.success) {
        setTimeout(() => {
            showToast({
                theme: "success",
                title: "The linking process successful",
                desc: "Redirect you to gateway spot list page",
            });
            setTimeout(() => {
                return (window.location = "/dashboard/gateway/spot/list");
            }, 3500);
        }, 3500);
    }
});

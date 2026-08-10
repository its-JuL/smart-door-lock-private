const numberOfBuildings = document.getElementById("numberOfBuildings");
const numberOfOperators = document.getElementById("numberOfOperators");
const buildingList = document.getElementById("buildingList");
const showMoreBtn = document.querySelector("#showMore");
const buildingForm = document.querySelector("#buildingForm");
const searchBtn = document.querySelector("#search");

const deleteAction = async (id) => {
    const element = document.getElementById("building-template-" + id);
    const resp = await setter({
        url: "/api/v1/building/delete",
        body: { buildingId: id },
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
        desc: `Are you sure you want to delete the ${buildingName} building`,
        link: "#",
        btn: "Delete",
        exec: () => deleteAction(id),
    });
};

const buildingListTemplate = (building) => {
    return `
    <div class="table-row d-flex py-2 py-md-2 justify-content-between px-3 building--list-item" 
        data-id="${building.id}" id="building-template-${building.id}">
        <span class="table-data text-center text-neutral-2">${
            building.name
        }</span>
        <p class="table-data text-center text-neutral-2">
            ${building.rooms.length}
        </p>
        <p class="table-data text-center text-neutral-2">
            ${days(building.createdAt)}
        </p>
        <div class="table-data pointer d-flex justify-content-center">
            <span class="hover-tool me-1 pointer" data-hover="Delete"
             onclick="deleteToggle('${building.id}','${building.name}')">
                <img src="/image/icon_delete.svg" alt="Delete" class="image">
            </span>

            <a 
                href="/dashboard/building/detail/${building.id}"
                class="hover-tool pointer" data-hover="Edit">
                <img src="/image/icon_edit.svg" alt="Edit" class="image">
            </a>
        </div>
    </div>
    `;
};

const buildingInformation = (data) => {
    numberOfBuildings.textContent = data.numberOfBuildings;
    numberOfOperators.textContent = data.numberOfOperators;

    data.buildingList.forEach((building) => {
        buildingList.insertAdjacentHTML(
            "beforeend",
            buildingListTemplate(building)
        );
    });
};

const buildingListLoader = (data) => {
    data.forEach((building) => {
        buildingList.insertAdjacentHTML(
            "beforeend",
            buildingListTemplate(building)
        );
    });
};

generalDataLoader({
    url: "/api/v1/building/general-information",
    func: buildingInformation,
});

showMoreBtn.addEventListener("click", (e) => {
    e.preventDefault();
    const cursor = lastCursorFinder(".building--list-item", "id");
    const search = buildingForm.value;

    if (search.length > 0) {
        generalDataLoader({
            url: `/api/v1/building/list/?cursor=${cursor}&search=${search}`,
            func: buildingListLoader,
        });
    }
    if (search.length === 0) {
        generalDataLoader({
            url: `/api/v1/building/list/?cursor=${cursor}`,
            func: buildingListLoader,
        });
    }
});

searchBtn.addEventListener("click", (e) => {
    e.preventDefault();
    const search = buildingForm.value;
    buildingList.textContent = "";
    generalDataLoader({
        url: `/api/v1/building/list/?search=${search}`,
        func: buildingListLoader,
    });
});

const uuid = document.querySelector("#user-uuid").getAttribute("data-uuid");
const usernameContainerDetail = document.querySelector("#username");
const uploadBtnTrigger = document.querySelector(".form-upload-trigger");
const uploadForm = document.querySelector("#profil-picture");
const saveBtn = document.querySelector("#save-profil");
const passwordBtn = document.querySelector("#save-password");
const form = document.querySelector("#profile-form");
const usernameContainer = document.querySelector("#user-container");
const imageContainer = document.querySelector(".profil-img-container");
const oldUsername = form.full_name.value;
uploadBtnTrigger.addEventListener("click", (e) => {
    uploadForm.click();
});

uploadForm.addEventListener("change", async (e) => {
    const fileSize = uploadForm.files[0].size / 1024 / 1024; // in MiB
    const fileError = [];
    if (fileSize > 2) {
        showAlert({
            theme: "warning",
            title: "Failed upload photo",
            desc: "File size exceeds 2 MiB",
        });
        fileError.push("File size exceeds 2 MiB");
    }

    const fileUrl = String(uploadForm.files[0].type).split("/");
    const fileType = fileUrl[fileUrl.length - 1];
    if (
        !(
            fileType === "jpg" ||
            fileType === "jpeg" ||
            fileType === "png" ||
            fileType === "JPG" ||
            fileType === "JPEG" ||
            fileType === "PNG"
        )
    ) {
        showAlert({
            theme: "warning",
            title: "Failed upload photo",
            desc: "File type not allow to upload",
        });
        fileError.push("File type not allow");
    }

    if (fileError.length === 0) {
        const form = new FormData();
        form.append("avatar", uploadForm.files[0]);
        form.append("uuid", uuid);
        const resp = await fileUpload({
            url: "/api/v1/user/admin/update/profile/picture",
            body: form,
            successMsg: "Success update user avatar",
            failedMsg: "Failed update user avatar",
        });

        if (resp.success) {
            imageContainer.src = resp.data.photo;
        }
    }
});

saveBtn.addEventListener("click", async (e) => {
    e.preventDefault();
    const resp = await setter({
        url: "/api/v1/user/admin/update/profile",
        body: {
            uuid,
            email: form.email.value,
            full_name: form.full_name.value,
            username: form.username.value,
        },
        failedBody: "Sorry we couldn't update users profile",
        successBody: "Successfully update users profile",
    });

    if (resp.success && oldUsername !== resp.data.username) {
        usernameContainerDetail.textContent = resp.data.username;
        const url = String(window.location.href);
        const splitUrl = url.split("/");
        const usernameToChange = splitUrl[splitUrl.length - 1];
        setTimeout(() => {
            const newUrl = url.replace(usernameToChange, resp.data.username);
            window.location.href = newUrl;
        }, 2500);
    }
});

passwordBtn.addEventListener("click", async (e) => {
    e.preventDefault();
    const resp = await setter({
        url: "/api/v1/user/admin/update/password",
        body: {
            uuid,
            newPassword: document.querySelector("#newPassord").value,
        },
        failedBody: "Sorry can't update your password",
    });
    document.querySelector("#newPassord").value = "";
});

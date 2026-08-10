const uploadBtnTrigger = document.querySelector(".form-upload-trigger");
const uploadForm = document.querySelector("#profil-picture");
const saveBtn = document.querySelector("#save-profil");
const verifyBtn = document.querySelector("#verify");
const passwordBtn = document.querySelector("#save-password");
const form = document.querySelector("#profile-form");
const usernameContainer = document.querySelector("#user-container");
const imageContainer = document.querySelector(".profil-img-container");
const nanvbarAvatar = document.querySelector("#small-profil");
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
        const resp = await fileUpload({
            url: "/api/v1/user/update/profile/picture",
            body: form,
            successMsg: "Success update avatar",
            failedMsg: "Failed update avatar",
        });

        if (resp.success) {
            imageContainer.src = resp.data.photo;
            nanvbarAvatar.src = resp.data.photo;
        }
    }
});

saveBtn.addEventListener("click", async (e) => {
    e.preventDefault();
    const resp = await setter({
        url: "/api/v1/user/update/profile",
        body: {
            email: form.email.value,
            full_name: form.full_name.value,
            username: form.username.value,
        },
        failedBody: "Sorry we couldn't update your profile",
        successBody: "Successfully update your profile",
    });

    if (resp.success) {
        usernameContainer.textContent = resp.data.username;
    }
});

passwordBtn.addEventListener("click", async (e) => {
    e.preventDefault();
    const resp = await setter({
        url: "/api/v1/user/update/password",
        body: {
            oldPassword: document.querySelector("#oldPassword").value,
            newPassword: document.querySelector("#newPassord").value,
        },
        failedBody: "Sorry cant update your password",
    });
    document.querySelector("#oldPassword").value = "";
    document.querySelector("#newPassord").value = "";
});

try {
    verifyBtn.addEventListener("click", async (e) => {
        e.preventDefault();
        const resp = await setter({
            url: "/api/v1/user/send-verification-link",
        });
    });
} catch (error) {}

const submit = document.querySelector("#submit");
const form = document.querySelector("form");
const url = new URLSearchParams(window.location.search);
const token = url.get("token");
submit.addEventListener("click", async (e) => {
    e.preventDefault();
    document.querySelector("#password--error").textContent = "";
    const password = form.password.value;
    const resp = await setter({
        url: `/api/v1/user/reset-password/?token=${token}`,
        body: { password: password },
    });

    if (resp.success) {
        setTimeout(() => {
            window.location = "/auth/login";
        }, 2500);
    }
});

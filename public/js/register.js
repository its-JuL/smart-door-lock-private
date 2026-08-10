const submit = document.querySelector("#submit");
const form = document.querySelector("form");
submit.addEventListener("click", async (e) => {
    e.preventDefault();
    document.querySelector("#username--error").textContent = "";
    document.querySelector("#email--error").textContent = "";
    document.querySelector("#password--error").textContent = "";
    const username = form.username.value;
    const password = form.password.value;
    const email = form.email.value;
    startLoader();
    await fetch("/api/v1/user/register", {
        headers: {
            "Content-Type": "application/json",
        },
        method: "POST",
        body: JSON.stringify({
            username: username,
            email: email,
            password: password,
        }),
    })
        .then((res) => {
            return res.json();
        })
        .then((data) => {
            closeLoader();
            if (!data.success) throw data;
            setToast({
                status: "success",
                title: "Berhasil Mendaftar",
                msg: "Berhasil mendaftarkan dan mengauntentikasi user",
            });
            return (window.location = "/dashboard/");
        })
        .catch((err) => {
            closeLoader();
            if (err) {
                const errors = err.data.errors;
                for (const error in errors) {
                    document.querySelector(
                        `#${errors.errors.type}--error`
                    ).textContent = errors[error].detail;
                }
            }
        });
});

"use strict";
const submit = document.querySelector("#submit");
const form = document.querySelector("form");
submit.addEventListener("click", async (e) => {
    e.preventDefault();
    document.querySelector("#username--error").textContent = "";
    document.querySelector("#password--error").textContent = "";
    const username = form.username.value;
    const password = form.password.value;
    await fetch("/api/v1/user/login", {
        headers: {
            "Content-Type": "application/json",
        },
        method: "POST",
        body: JSON.stringify({
            username: username,
            password: password,
        }),
    })
        .then((res) => {
            return res.json();
        })
        .then((data) => {
            if (!data.success) throw data;
            setToast({
                status: "success",
                title: "Login Success",
                msg: "Success authenticate user",
            });
            return (window.location = "/dashboard");
        })
        .catch((err) => {
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

const submit = document.querySelector("#submit");
const form = document.querySelector("form");
submit.addEventListener("click", async (e) => {
    e.preventDefault();
    document.querySelector("#email--error").textContent = "";
    const email = form.email.value;
    const resp = await setter({
        url: "/api/v1/user/forgot-password/",
        body: { email: email },
    });
});

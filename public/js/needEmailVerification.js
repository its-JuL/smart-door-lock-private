document.getElementById("verify-btn").addEventListener("click", async (e) => {
    e.preventDefault();
    const resp = await setter({
        url: "/api/v1/user/send-verification-link",
        successMsg: "Success send verification",
        successBody: "Check your email to get verification link",
    });
});

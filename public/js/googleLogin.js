"use strict";

/**
 * Login dengan Google Identity Services (GIS).
 * Tombol Google merender iframe milik Google, lalu memanggil callback global
 * di bawah ini dengan ID token (JWT) yang sudah ditandatangani Google.
 * Token itu dikirim ke backend untuk diverifikasi, backend yang menerbitkan cookie JWT.
 */

async function handleGoogleCredential(response) {
    try {
        const res = await fetch("/api/v1/user/google-login", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ credential: response.credential }),
        });
        const data = await res.json();
        if (!data.success) throw data;

        setToast({
            status: "success",
            title: "Login Success",
            msg: "Berhasil login dengan Google",
        });

        // USER diarahkan ke halaman user, ADMIN/OPERATOR ke dashboard
        window.location = data.data.role === "USER" ? "/" : "/dashboard";
    } catch (err) {
        const detail =
            err?.data?.errors?.errors?.detail ||
            err?.data?.errors?.detail ||
            "Gagal login dengan Google";
        setToast({ status: "error", title: "Login gagal", msg: detail });
        console.error("[Google Login]", err);
    }
}

function initGoogleButton(attempt = 0) {
    const container = document.querySelector("#google-button");

    if (!container || !window.GOOGLE_CLIENT_ID) return;

    // Script GIS dimuat async, jadi tunggu sampai objek google tersedia
    if (!window.google?.accounts?.id) {
        if (attempt < 50) return setTimeout(() => initGoogleButton(attempt + 1), 100);
        console.error("[Google Login] Script Google Identity Services gagal dimuat");
        return;
    }

    google.accounts.id.initialize({
        client_id: window.GOOGLE_CLIENT_ID,
        callback: handleGoogleCredential,
    });

    google.accounts.id.renderButton(container, {
        theme: "outline",
        size: "large",
        width: 320,
        text: "signin_with",
        shape: "rectangular",
        locale: "id",
    });
}

window.addEventListener("load", () => initGoogleButton());

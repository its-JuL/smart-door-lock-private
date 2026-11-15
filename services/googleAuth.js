if (process.env.NODE_ENV !== "PRODUCTION") require("dotenv").config();
const { OAuth2Client } = require("google-auth-library");

/**
 * Google Sign-In memakai client ID yang berbeda untuk development dan production,
 * supaya origin localhost tidak pernah ikut terdaftar di OAuth client production.
 * NODE_ENV di .env lokal bernilai "development", di VPS "PRODUCTION".
 */
const isProduction = String(process.env.NODE_ENV || "").toUpperCase() === "PRODUCTION";

const clientId = isProduction
    ? process.env.GOOGLE_CLIENT_ID_PROD
    : process.env.GOOGLE_CLIENT_ID_DEV;

const allowedDomain = String(process.env.GOOGLE_ALLOWED_DOMAIN || "")
    .trim()
    .toLowerCase();

const client = clientId ? new OAuth2Client(clientId) : null;

/** Tombol Google hanya dirender kalau client ID untuk environment ini terisi */
const isEnabled = Boolean(clientId);

/**
 * Verifikasi ID token (credential) yang dikirim tombol Google Identity Services.
 * Google yang menandatangani token, jadi kita cukup cek signature + audience.
 * @param {string} credential JWT dari google.accounts.id
 * @returns {Promise<object>} payload token (sub, email, email_verified, name, picture, hd)
 */
const verifyGoogleCredential = async (credential) => {
    if (!isEnabled) throw new Error("Google Sign-In belum dikonfigurasi");

    const ticket = await client.verifyIdToken({
        idToken: credential,
        audience: clientId,
    });

    const payload = ticket.getPayload();

    // Opsional: batasi ke satu domain Google Workspace (mis. pnj.ac.id).
    // Akun Gmail biasa tidak punya claim "hd", jadi otomatis ditolak kalau batasan ini aktif.
    if (allowedDomain && String(payload.hd || "").toLowerCase() !== allowedDomain) {
        throw new Error(`Akun Google harus dari domain ${allowedDomain}`);
    }

    return payload;
};

module.exports = {
    clientId,
    isEnabled,
    isProduction,
    allowedDomain,
    verifyGoogleCredential,
};

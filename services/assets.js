const fs = require("fs");
const path = require("path");

let SafeString = null;
try {
    ({ SafeString } = require("handlebars"));
} catch (error) {
    SafeString = null;
}

const PUBLIC_DIR = path.join(__dirname, "..", "public");
const versionCache = new Map();

const wrap = (url) => (SafeString ? new SafeString(url) : url);

/**
 * Menambahkan ?v=<mtime> pada aset lokal supaya browser dan CDN (Cloudflare)
 * tidak menyajikan versi lama setelah deploy. URL asing (http/https, data:)
 * dibiarkan apa adanya.
 */
const assetUrl = (assetPath) => {
    const raw = String(assetPath || "");
    if (!raw) return raw;
    if (/^(https?:)?\/\//i.test(raw) || raw.startsWith("data:")) return raw;

    const [pathname, ...rest] = raw.split("?");
    const filePath = path.join(PUBLIC_DIR, pathname.replace(/^\/+/, ""));

    let version = versionCache.get(filePath);
    if (version === undefined) {
        try {
            version = Math.floor(fs.statSync(filePath).mtimeMs).toString(36);
        } catch (error) {
            version = "";
        }
        versionCache.set(filePath, version);
    }

    if (!version) return raw;
    const query = rest.length ? `?${rest.join("?")}&v=${version}` : `?v=${version}`;
    return wrap(`${pathname}${query}`);
};

module.exports = { assetUrl, PUBLIC_DIR };

const test = require("node:test");
const assert = require("node:assert");
const fs = require("fs");
const path = require("path");
const expbs = require("express-handlebars");

const ROOT = path.join(__dirname, "..");
const { assetUrl } = require("../services/assets");
const url = (asset) => String(assetUrl(asset));

test("assetUrl menambahkan versi mtime pada aset lokal", () => {
    assert.match(url("/js/hardware.js"), /^\/js\/hardware\.js\?v=[0-9a-z]+$/);
});

test("assetUrl membiarkan URL eksternal apa adanya", () => {
    const cdn = "https://cdn.jsdelivr.net/npm/bootstrap@5.0.2/dist/js/bootstrap.min.js";
    assert.equal(url(cdn), cdn);
    assert.equal(url("//cdn.example.com/a.js"), "//cdn.example.com/a.js");
});

test("assetUrl tidak menambah versi untuk file yang tidak ada", () => {
    assert.equal(url("/js/tidak-ada.js"), "/js/tidak-ada.js");
});

test("versi ikut berubah saat mtime file berubah", () => {
    const file = path.join(ROOT, "public", "js", "hardware.js");
    const stat = fs.statSync(file);
    const before = url("/js/hardware.js");

    fs.utimesSync(file, stat.atime, new Date(stat.mtimeMs + 5000));
    delete require.cache[require.resolve("../services/assets")];
    const after = String(require("../services/assets").assetUrl("/js/hardware.js"));
    fs.utimesSync(file, stat.atime, stat.mtime);
    delete require.cache[require.resolve("../services/assets")];

    assert.notEqual(before, after);
});

test("layout base merender script dengan versi tanpa escape", async () => {
    const hbs = expbs.create({ extname: ".hbs", helpers: { assetUrl } });
    const html = await hbs.render(path.join(ROOT, "views", "layouts", "base.hbs"), {
        user: "zulfa",
        scripts: ["/js/hardware.js"],
        styles: ["/style/hardware.css"],
        helpers: { assetUrl },
    });

    assert.match(html, /src="\/js\/hardware\.js\?v=[0-9a-z]+"/, "script dari controller harus berversi");
    assert.match(html, /src="\/js\/util\/toast\.js\?v=[0-9a-z]+"/, "util js harus berversi");
    assert.match(html, /href="\/style\/base\.css\?v=[0-9a-z]+"/, "css harus berversi");
    assert.doesNotMatch(html, /&#x3D;/, "tanda = tidak boleh di-escape");
    assert.match(html, /src="\/socket\.io\/socket\.io\.js"/, "socket.io tidak perlu versi");
});

test("semua layout memakai helper assetUrl", () => {
    for (const name of ["base", "operatorBase", "adminteknisBase", "userBase", "auth"]) {
        const file = path.join(ROOT, "views", "layouts", `${name}.hbs`);
        const src = fs.readFileSync(file, "utf8");
        assert.match(src, /\{\{#each scripts\}\}\s*<script src="\{\{assetUrl this\}\}">/, `${name}: script dari controller belum berversi`);
        assert.match(src, /\{\{assetUrl "\/js\/util\/toast\.js"\}\}/, `${name}: util js belum berversi`);
    }
});

test("app.js mendaftarkan helper ke engine handlebars", () => {
    const src = fs.readFileSync(path.join(ROOT, "app.js"), "utf8");
    assert.match(src, /require\("\.\/services\/assets"\)/);
    assert.match(src, /helpers:\s*\{\s*assetUrl\s*\}/);
});

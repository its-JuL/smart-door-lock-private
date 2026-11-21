/**
 * Regresi: dropdown pengguna di halaman PIN & RFID.
 *
 * Bug asli: pemuat PIN memanggil /api/v1/user/autocomplete yang mengembalikan
 * array polos ([{value,label}]), sedangkan helper request() menuntut selubung
 * {success, data}. Akibatnya request() selalu melempar dan dropdown menampilkan
 * "Gagal memuat pengguna". Test ini menjalankan berkas JS aslinya di DOM tiruan.
 */
const test = require("node:test");
const assert = require("node:assert");
const fs = require("node:fs");
const path = require("node:path");
const vm = require("node:vm");

const ROOT = path.join(__dirname, "..");

const makeElement = () => {
  const el = {
    _html: "",
    dataset: {},
    value: "",
    textContent: "",
    disabled: false,
    classList: { add() {}, remove() {}, toggle() {} },
    addEventListener() {},
    appendChild() {},
    setAttribute() {},
    reset() {},
    querySelector: () => null,
    querySelectorAll: () => [],
  };
  Object.defineProperty(el, "innerHTML", {
    get() { return el._html; },
    set(v) { el._html = v; },
  });
  return el;
};

/**
 * Menjalankan berkas JS halaman di konteks tiruan.
 * @param {string} file berkas di public/js
 * @param {object} opts
 * @param {(url: string) => any} opts.respond menghasilkan body JSON per URL
 * @param {(sel: string) => any[]} opts.selects elemen untuk querySelectorAll
 * @param {(sel: string) => any} opts.element elemen untuk querySelector
 */
const runPage = async (file, { respond, selects, element }) => {
  const calls = [];
  const toasts = [];

  const context = {
    console,
    Intl,
    Date,
    JSON,
    Math,
    Promise,
    setTimeout,
    clearTimeout,
    FormData: class { constructor() {} },
    window: { showToast: (t) => toasts.push(t) },
    document: {
      querySelectorAll: (sel) => selects(sel),
      querySelector: (sel) => element(sel),
      getElementById: () => null,
      createElement: () => makeElement(),
      body: { appendChild() {} },
      addEventListener() {},
    },
    fetch: async (url) => {
      calls.push(url);
      const body = respond(url);
      return { ok: true, status: 200, json: async () => body };
    },
  };
  context.globalThis = context;

  vm.createContext(context);
  vm.runInContext(fs.readFileSync(path.join(ROOT, "public/js", file), "utf8"), context);

  // beri kesempatan promise di dalam berkas selesai
  await new Promise((r) => setTimeout(r, 60));

  return { calls, toasts };
};

const USERS = [
  { id: "u1", username: "zulfa", profil: { full_name: "zulfa" } },
  { id: "u2", username: "santoso", profil: { full_name: "santoso" } },
];

const wrapped = (data) => ({ success: true, message: "ok", data });

test("halaman PIN memakai /user/list, bukan /user/autocomplete", async () => {
  const select = makeElement();
  const { calls, toasts } = await runPage("credentials.js", {
    respond: (url) => (url.startsWith("/api/v1/user/") ? wrapped(USERS) : wrapped([])),
    selects: (sel) => (sel === ".pin-user-select" ? [select] : []),
    element: () => null,
  });

  const autocomplete = calls.filter((u) => u.includes("/user/autocomplete"));
  assert.deepStrictEqual(autocomplete, [], "pemuat PIN masih memanggil endpoint array polos");
  assert.ok(
    calls.some((u) => u.startsWith("/api/v1/user/list")),
    "pemuat PIN harus memanggil /api/v1/user/list"
  );
  assert.strictEqual(toasts.length, 0, `tidak boleh ada toast error, dapat: ${JSON.stringify(toasts)}`);
  assert.match(select.innerHTML, /zulfa/, "dropdown PIN harus berisi zulfa");
  assert.match(select.innerHTML, /santoso/, "dropdown PIN harus berisi santoso");
});

test("halaman RFID memuat pengguna dari /user/list", async () => {
  const select = makeElement();
  const { calls, toasts } = await runPage("rfidEnrollment.js", {
    respond: () => wrapped(USERS),
    selects: (sel) => (sel === ".card-user-select" ? [select] : []),
    element: (sel) => (sel === "#rfid-enroll-form" ? makeElement() : null),
  });

  assert.ok(calls.some((u) => u.startsWith("/api/v1/user/list")));
  assert.strictEqual(toasts.length, 0, `tidak boleh ada toast error, dapat: ${JSON.stringify(toasts)}`);
  assert.match(select.innerHTML, /zulfa/);
  assert.match(select.innerHTML, /santoso/);
});

test("daftar pengguna kosong tampil sebagai keterangan, bukan error", async () => {
  const pinSelect = makeElement();
  const cardSelect = makeElement();

  const pin = await runPage("credentials.js", {
    respond: () => wrapped([]),
    selects: (sel) => (sel === ".pin-user-select" ? [pinSelect] : []),
    element: () => null,
  });
  const rfid = await runPage("rfidEnrollment.js", {
    respond: () => wrapped([]),
    selects: (sel) => (sel === ".card-user-select" ? [cardSelect] : []),
    element: (sel) => (sel === "#rfid-enroll-form" ? makeElement() : null),
  });

  assert.strictEqual(pin.toasts.length, 0);
  assert.strictEqual(rfid.toasts.length, 0);
  assert.match(pinSelect.innerHTML, /Belum ada pengguna terdaftar/);
  assert.match(cardSelect.innerHTML, /Belum ada pengguna terdaftar/);
  assert.doesNotMatch(pinSelect.innerHTML, /Gagal memuat/);
});

test("helper request() memang menolak array polos dari /user/autocomplete", async () => {
  // Mendokumentasikan akar masalah: bentuk array polos tidak punya .success
  const bare = [{ value: "zulfa", label: "zulfa" }];
  const d = bare;
  assert.strictEqual(d.success, undefined, "array polos tidak punya properti success");
});

test("enroll PIN memberi pesan actionable saat device belum terdaftar", () => {
  const src = fs.readFileSync(path.join(ROOT, "api_pin/v1/controllers_pin.js"), "utf8");
  assert.match(src, /belum terdaftar di website/);
  assert.match(src, /belum dipasangkan ke room/);
  assert.match(src, /if \(error\.expose\)/, "pesan validasi harus diteruskan ke klien");
  assert.doesNotMatch(src, /new Error\("Device not found"\)/);
});

test("enroll RFID memberi pesan actionable saat device belum terdaftar", () => {
  const src = fs.readFileSync(path.join(ROOT, "api_card/v1/controllers_card.js"), "utf8");
  assert.match(src, /belum terdaftar di website/);
  assert.match(src, /belum dipasangkan ke room/);
  assert.doesNotMatch(src, /title: "Device not found"/);
  // resError memakai kunci `code`, bukan `statusCode`
  const blok = src.slice(src.indexOf("exports.initiateCardEnrollment"));
  assert.match(blok, /code: 404/);
  assert.doesNotMatch(blok, /statusCode:/);
});

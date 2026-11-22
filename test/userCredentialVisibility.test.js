/**
 * Regresi: visibilitas autentikasi untuk USER dan akses OPERATOR.
 *
 * Dua bug yang dijaga di sini:
 * 1. Operator tidak bisa memakai PIN/sidik jari/wajah karena
 *    GET /api/v2/room/device/list hanya mengizinkan ADMIN & ADMIN TEKNIS,
 *    sehingga dropdown device di halaman autentikasi kosong.
 * 2. User tidak punya halaman untuk melihat status autentikasinya sendiri;
 *    yang tampil hanya daftar kartu.
 */
const test = require("node:test");
const assert = require("node:assert");
const fs = require("node:fs");
const path = require("node:path");

const ROOT = path.join(__dirname, "..");
const {
  labelAuthenticationMethod,
  buildCredentialSummary,
  buildAccessHistory,
} = require("../services/credentialSummary");
const {
  createAccessScope,
  filterDevicesForScope,
} = require("../services/operatorScope");

test("label metode autentikasi memakai istilah Indonesia", () => {
  assert.equal(labelAuthenticationMethod("RFID"), "Kartu RFID");
  assert.equal(labelAuthenticationMethod("FINGERPRINT"), "Sidik Jari");
  assert.equal(labelAuthenticationMethod("PIN"), "PIN");
  assert.equal(labelAuthenticationMethod("FACE"), "Wajah");
  assert.equal(labelAuthenticationMethod(undefined), "Tidak diketahui");
});

test("ringkasan menandai kartu terdaftar dan belum terdaftar", () => {
  const summary = buildCredentialSummary({
    cards: [
      { card_number: "123", card_name: "Kartu Kampus", card_status: "REGISTER", room: [{ ruid: "m_49x", name: "AA201" }] },
      { card_number: "456", card_status: "UNREGISTER", room: [] },
      { card_number: "789", card_status: "REGISTER", banned: true, room: [] },
    ],
  });

  assert.equal(summary.counts.cards, 3);
  assert.equal(summary.cards[0].status, "Terdaftar");
  assert.equal(summary.cards[0].isRegistered, true);
  assert.equal(summary.cards[0].rooms, "AA201");
  assert.equal(summary.cards[1].status, "Belum terdaftar");
  assert.equal(summary.cards[1].isRegistered, false);
  assert.equal(summary.cards[2].status, "Diblokir");
  assert.equal(summary.cards[2].isRegistered, false);
});

test("ringkasan menampilkan status PIN, sidik jari, dan wajah", () => {
  const summary = buildCredentialSummary({
    pins: [{ deviceId: "main_esp32_01", isActive: true, room: { ruid: "m_49x", name: "AA201" } }],
    fingerprints: [
      { deviceId: "main_esp32_01", fingerId: 2, isActive: true, room: { ruid: "m_49x", name: "AA201" } },
      { deviceId: "main_esp32_01", fingerId: 3, isActive: false, room: { ruid: "m_49x", name: "AA201" } },
    ],
    faces: [{ isActive: true, room: { ruid: "m_49x", name: "AA201" } }],
  });

  assert.equal(summary.counts.pins, 1);
  assert.equal(summary.pins[0].room, "AA201");
  assert.equal(summary.pins[0].status, "Aktif");
  assert.equal(summary.counts.fingerprints, 2);
  assert.equal(summary.fingerprints[1].status, "Nonaktif");
  assert.equal(summary.fingerprints[1].isActive, false);
  assert.equal(summary.counts.faces, 1);
  assert.equal(summary.hasAny, true);
});

test("ringkasan kosong tetap aman dirender", () => {
  const summary = buildCredentialSummary();
  assert.equal(summary.hasAny, false);
  assert.deepEqual(summary.counts, { cards: 0, pins: 0, fingerprints: 0, faces: 0 });
});

test("riwayat akses memuat metode apa pun, bukan hanya kartu", () => {
  const history = buildAccessHistory([
    { authenticationMethod: "FINGERPRINT", isSuccess: true, room: { name: "AA201" } },
    { authenticationMethod: "PIN", isSuccess: false, room: { name: "AA201" } },
    { authenticationMethod: "FACE", isSuccess: true, room: null, unregisteredCard: "Face unknown" },
  ]);

  assert.equal(history.length, 3);
  assert.equal(history[0].methodLabel, "Sidik Jari");
  assert.equal(history[0].status, "Berhasil");
  assert.equal(history[1].methodLabel, "PIN");
  assert.equal(history[1].status, "Ditolak");
  assert.equal(history[2].methodLabel, "Wajah");
  assert.equal(history[2].room, "-");
  assert.equal(history[2].credential, "Face unknown");
});

test("operator hanya melihat device di gedung yang ditugaskan", () => {
  const operatorScope = createAccessScope({
    userId: "u1",
    roleName: "OPERATOR",
    buildings: [
      {
        id: "b1",
        rooms: [{ id: "r1", ruid: "m_49x", device: { device_id: "main_esp32_01" } }],
      },
    ],
  });

  const devices = [
    { device_id: "main_esp32_01", roomId: "r1" },
    { device_id: "main_esp32_02", roomId: "r2" },
    { device_id: "main_esp32_03", roomId: null },
  ];

  const visible = filterDevicesForScope(devices, operatorScope);
  assert.deepEqual(visible.map((d) => d.device_id), ["main_esp32_01"]);
});

test("admin dan admin teknis tetap melihat semua device", () => {
  const adminScope = createAccessScope({ userId: "u2", roleName: "ADMIN" });
  const teknisiScope = createAccessScope({ userId: "u3", roleName: "ADMIN TEKNIS" });
  const devices = [{ device_id: "a", roomId: "r1" }, { device_id: "b", roomId: null }];

  assert.equal(filterDevicesForScope(devices, adminScope).length, 2);
  assert.equal(filterDevicesForScope(devices, teknisiScope).length, 2);
});

test("rute device list mengizinkan OPERATOR dengan scope", () => {
  const source = fs.readFileSync(path.join(ROOT, "api_room/v2/router.js"), "utf8");
  const route = source.slice(source.indexOf('"/device/list"') - 40, source.indexOf('"/device/list"') + 200);

  assert.match(route, /allowedRole\("ADMIN", "ADMIN TEKNIS", "OPERATOR"\)/);
  assert.match(route, /loadAccessScope/);
});

test("controller device list memfilter hasil sesuai scope", () => {
  const source = fs.readFileSync(path.join(ROOT, "api_room/v2/controllers.js"), "utf8");
  assert.match(source, /filterDevicesForScope\(deviceList, req\.accessScope\)/);
});

test("rute /authentication tersedia untuk USER", () => {
  const source = fs.readFileSync(path.join(ROOT, "app_user/router.js"), "utf8");
  assert.match(source, /router\.get\("\/authentication", allowedRole\("USER"\), user\.authentication\)/);
});

test("menu user memuat tautan Autentikasi", () => {
  const source = fs.readFileSync(path.join(ROOT, "views/layouts/userBase.hbs"), "utf8");
  assert.match(source, /href="\/authentication"/);
});

test("halaman autentikasi user dirender tanpa data", async () => {
  const expbs = require("express-handlebars");
  const hbs = expbs.create({ extname: ".hbs" });
  const html = await hbs.render(
    path.join(ROOT, "views/user/userAuthentication.handlebars"),
    {
      summary: buildCredentialSummary(),
      history: [],
      hasHistory: false,
    }
  );

  assert.match(html, /Autentikasi Saya/);
  assert.match(html, /Belum ada PIN terdaftar/);
  assert.match(html, /Belum ada sidik jari terdaftar/);
  assert.match(html, /Belum ada wajah terdaftar/);
  assert.match(html, /Belum ada permintaan akses yang tercatat/);
});

test("halaman autentikasi user menampilkan data terdaftar", async () => {
  const expbs = require("express-handlebars");
  const hbs = expbs.create({ extname: ".hbs" });
  const summary = buildCredentialSummary({
    pins: [{ deviceId: "main_esp32_01", isActive: true, room: { name: "AA201" } }],
    fingerprints: [{ deviceId: "main_esp32_01", fingerId: 1, isActive: true, room: { name: "AA201" } }],
  });
  const html = await hbs.render(
    path.join(ROOT, "views/user/userAuthentication.handlebars"),
    {
      summary,
      history: buildAccessHistory([
        { authenticationMethod: "FINGERPRINT", isSuccess: true, room: { name: "AA201" } },
      ]),
      hasHistory: true,
    }
  );

  assert.match(html, /main_esp32_01/);
  assert.match(html, /AA201/);
  assert.match(html, /Sidik Jari/);
  assert.match(html, /Berhasil/);
});

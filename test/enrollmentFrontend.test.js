const test = require("node:test");
const assert = require("node:assert");
const fs = require("node:fs");
const path = require("node:path");

const ROOT = path.join(__dirname, "..");
const read = (relativePath) => fs.readFileSync(path.join(ROOT, relativePath), "utf8");

test("tombol pembuka form tidak mengaku langsung memulai enrollment", () => {
  const views = [
    "views/cardList.handlebars",
    "views/fingerprintList.handlebars",
    "views/faceRecognition.handlebars",
  ].map(read).join("\n");

  assert.doesNotMatch(views, />Mulai Enroll(?: RFID)?<\/button>/i);
  assert.match(views, />Buka Form Enroll RFID<\/button>/);
  assert.match(views, />Buka Form Enroll Fingerprint<\/button>/);
  assert.match(views, />Buka Form Enroll Wajah<\/button>/);
});

test("semua form menjelaskan bahwa submit mengirim perintah ke perangkat", () => {
  for (const view of [
    "views/cardList.handlebars",
    "views/fingerprintList.handlebars",
    "views/faceRecognition.handlebars",
  ]) {
    assert.match(read(view), />Kirim perintah ke perangkat<\/button>/, view);
  }
});

test("frontend fingerprint memakai endpoint initiate-enrollment", () => {
  const source = read("public/js/credentials.js");
  assert.match(source, /\/api\/v1\/fingerprint\/initiate-enrollment/);
  assert.doesNotMatch(source, /\/api\/v1\/fingerprint\/register/);
});

test("frontend menampilkan status menunggu perangkat, bukan klaim enrollment sudah dimulai", () => {
  const credentials = read("public/js/credentials.js");
  const rfid = read("public/js/rfidEnrollment.js");

  assert.match(credentials, /Perintah fingerprint terkirim/);
  assert.match(credentials, /Perintah wajah terkirim/);
  assert.match(rfid, /Perintah RFID terkirim/);
  assert.match(credentials, /Menunggu respons perangkat/);
  assert.match(rfid, /Menunggu respons perangkat/);
});

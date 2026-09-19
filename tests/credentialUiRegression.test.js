const assert = require("assert");
const fs = require("fs");
const source = fs.readFileSync("public/js/credentials.js", "utf8");
const view = fs.readFileSync("views/fingerprintList.handlebars", "utf8");
assert.match(source, /const pinForm = e\.currentTarget;/, "PIN submit must retain its form before await");
assert.match(source, /pinForm\.reset\(\);/, "PIN submit must reset the retained form");
assert.match(view, /id="fingerprint-user-select"/, "Fingerprint form must provide a user picker to avoid manual invalid UUID input");
console.log("credential UI regression: PASS");

const assert = require("assert");
const fs = require("fs");
const source = fs.readFileSync("api_fingerprint/v1/controller_fingerprint.js", "utf8");
assert.match(source, /const \[device, user\] = await Promise\.all\(/, "Fingerprint controller must assign the second query result to user");
assert.doesNotMatch(source, /const \[device, room, user\] = await Promise\.all\(/, "Fingerprint controller must not read a nonexistent third Promise result");
console.log("fingerprint user lookup regression: PASS");

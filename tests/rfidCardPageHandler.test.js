const assert = require("assert");
const fs = require("fs");
const source = fs.readFileSync("views/cardList.handlebars", "utf8");
assert.match(source, /<script\s+src="\/js\/rfidEnrollment\.js"><\/script>/, "Card list must load the RFID enrollment submit handler.");
console.log("RFID card-page submit-handler regression: PASS");

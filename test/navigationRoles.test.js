const test = require("node:test");
const assert = require("node:assert/strict");
const fs = require("fs");
const path = require("path");

const layout = fs.readFileSync(
  path.join(__dirname, "../views/layouts/userBase.hbs"),
  "utf8"
);

test("USER navigation contains only routes guarded for USER", () => {
  assert.match(layout, /href="\/"/);
  assert.doesNotMatch(layout, /href="\/dashboard\/card\/list"/);
  assert.doesNotMatch(layout, /href="\/dashboard\/pin\/list"/);
  assert.doesNotMatch(layout, /href="\/dashboard\/fingerprint\/list"/);
  assert.doesNotMatch(layout, /href="\/dashboard\/face-recognition"/);
});

test("USER navigation exposes Card only once", () => {
  const cardLabels = layout.match(/>\s*Card\s*</g) || [];
  assert.equal(cardLabels.length, 1);
});

test("ADMIN TEKNIS layout is limited to Building and Room", () => {
  const technicalLayout = fs.readFileSync(
    path.join(__dirname, "../views/layouts/adminteknisBase.hbs"),
    "utf8"
  );
  assert.match(technicalLayout, /href="\/dashboard\/building\/list"/);
  assert.match(technicalLayout, /href="\/dashboard\/room\/list"/);
  assert.doesNotMatch(technicalLayout, /href="\/dashboard\/"/);
  assert.doesNotMatch(technicalLayout, /href="\/dashboard\/hardware"/);
  assert.doesNotMatch(technicalLayout, /href="\/dashboard\/api"/);
});

test("OPERATOR layout does not contain Building navigation", () => {
  const operatorLayout = fs.readFileSync(
    path.join(__dirname, "../views/layouts/operatorBase.hbs"),
    "utf8"
  );
  assert.doesNotMatch(operatorLayout, /href="\/dashboard\/building\/list"/);
});

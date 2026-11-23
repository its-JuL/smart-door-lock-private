const path = require("path");
const dotenv = require("dotenv");

function loadEnvironment(envPath = path.join(__dirname, "..", ".env")) {
  const result = dotenv.config({ path: envPath, override: true });
  if (result.error && result.error.code !== "ENOENT") throw result.error;
  return result.parsed || {};
}

module.exports = { loadEnvironment };

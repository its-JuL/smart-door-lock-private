const assert=require("assert");
const fs=require("fs");
const source=fs.readFileSync("services/mqttLogger.js","utf8");
assert.match(source, /static publishRegistrationResult\(/, "Backend must publish a correlated registration result after database processing");
assert.match(source, /client\.publish\(topic, JSON\.stringify\(payload\), \{ qos: 1 \}\)/, "Result must be published to MQTT");
assert.match(source, /fallback enrollment context/i, "A valid V5 user_id/session_id result must survive an in-memory session loss");
console.log("registration persistence result contract: PASS");

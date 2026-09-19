const assert = require("assert");
const { buildPinEnrollmentPlan } = require("../services/pinEnrollment");
(function testPinCommandCarriesCorrelationForHardwareAcknowledgement() {
 const plan=buildPinEnrollmentPlan({device:{device_id:"main_esp32_01"},targetUserId:"user-1",pin:"123456",sessionId:"pin_abc"});
 assert.deepStrictEqual(plan.command,{action:"upsert_user_pin",user_id:"user-1",session_id:"pin_abc",pin_hash:"8d969eef6ecad3c29a3a629280e686cf0c3f5d5a86aff3ca12020c923adc6c92"});
})();
console.log("PIN acknowledgement contract: PASS");

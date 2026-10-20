const assert = require("node:assert/strict");
const { validateReferral } = require("../src/utils/validateReferral");

const validReferral = {
  referralId: "REF-1001",
  patientId: "SYN-PAT-001",
  sourceDepartment: "General Medicine",
  targetDepartment: "Cardiology"
};

// 1. Valid referral
assert.equal(validateReferral(validReferral).isValid, true);
console.log("PASS: Valid referral accepted.");

// 2. Missing required field
const missingField = validateReferral({
  referralId: "REF-1002",
  patientId: "SYN-PAT-002",
  sourceDepartment: "General Medicine"
});

assert.equal(missingField.isValid, false);
assert.ok(missingField.missingFields.includes("targetDepartment"));
console.log("PASS: Missing targetDepartment detected.");

// 3. Blank required field
const blankField = validateReferral({
  ...validReferral,
  targetDepartment: "   "
});

assert.equal(blankField.isValid, false);
assert.ok(blankField.missingFields.includes("targetDepartment"));
console.log("PASS: Blank targetDepartment rejected.");

// 4. Null input
assert.equal(validateReferral(null).isValid, false);
console.log("PASS: Null input rejected.");

// 5. Undefined input
assert.equal(validateReferral(undefined).isValid, false);
console.log("PASS: Undefined input rejected.");

// 6. Non-object input
assert.equal(validateReferral("invalid").isValid, false);
console.log("PASS: String input rejected.");

// 7. Empty object
assert.equal(validateReferral({}).isValid, false);
console.log("PASS: Empty object rejected.");

// 8. All required fields blank
const blankReferral = {
  referralId: "",
  patientId: " ",
  sourceDepartment: "",
  targetDepartment: " "
};

const blankResult = validateReferral(blankReferral);

assert.equal(blankResult.isValid, false);
assert.equal(blankResult.missingFields.length, 4);
console.log("PASS: All blank required fields detected.");

console.log("\nAll referral validation tests passed.");

const { validateReferral } = require("../src/utils/validateReferral");

const validReferral = {
  referralId: "REF-1006",
  patientId: "SYN-PAT-006",
  sourceDepartment: "Cardiology",
  targetDepartment: "Neurology",
  priority: "High",
  status: "New"
};

const validResult = validateReferral(validReferral);

if (!validResult.isValid) {
  throw new Error("Valid referral was incorrectly rejected.");
}

console.log("PASS: Valid referral accepted.");

const invalidReferral = {
  referralId: "REF-1007",
  patientId: "SYN-PAT-007",
  sourceDepartment: "Cardiology",
  priority: "High",
  status: "New"
};

const invalidResult = validateReferral(invalidReferral);

if (
  invalidResult.isValid ||
  !invalidResult.missingFields.includes("targetDepartment")
) {
  throw new Error("Invalid referral was not detected correctly.");
}

console.log("PASS: Missing targetDepartment detected.");

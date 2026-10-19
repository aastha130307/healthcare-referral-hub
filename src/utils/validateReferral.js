
const REQUIRED_FIELDS = [
  "referralId",
  "patientId",
  "sourceDepartment",
  "targetDepartment"
];

function validateReferral(referral) {
  if (!referral || typeof referral !== "object") {
    return {
      isValid: false,
      missingFields: REQUIRED_FIELDS
    };
  }

  const missingFields = REQUIRED_FIELDS.filter((field) => {
    const value = referral[field];

    return (
      value === undefined ||
      value === null ||
      (typeof value === "string" && value.trim() === "")
    );
  });

  return {
    isValid: missingFields.length === 0,
    missingFields
  };
}

module.exports = { validateReferral };

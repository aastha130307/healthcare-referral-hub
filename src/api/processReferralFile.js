const fs = require("fs");
const path = require("path");
const { validateReferral } = require("../utils/validateReferral");

const filePath = path.join(
  __dirname,
  "../../data/referrals.json"
);

function processReferralFile() {
  const fileContent = fs.readFileSync(filePath, "utf8");
  const referrals = JSON.parse(fileContent);

  if (!Array.isArray(referrals)) {
    throw new Error("The JSON file must contain an array of referrals.");
  }

  let validCount = 0;
  let invalidCount = 0;

  for (const referral of referrals) {
    const result = validateReferral(referral);

    if (result.isValid) {
      validCount++;
      console.log(`VALID: ${referral.referralId}`);
    } else {
      invalidCount++;
      console.log(
        `INVALID: ${referral.referralId} | Missing: ${result.missingFields.join(", ")}`
      );
    }
  }

  console.log("\nBatch processing summary");
  console.log(`Total referrals: ${referrals.length}`);
  console.log(`Valid referrals: ${validCount}`);
  console.log(`Invalid referrals: ${invalidCount}`);
}

processReferralFile();

const assert = require("node:assert/strict");
const test = require("node:test");

const {
  transformFHIRToReferrals
} = require("../src/utils/transformFHIRToReferrals");

test("transforms active diabetes into referral", () => {
  const bundle = {
    resourceType: "Bundle",
    entry: [
      {
        resource: {
          resourceType: "Patient",
          id: "PAT-001"
        }
      },
      {
        resource: {
          resourceType: "Condition",
          id: "COND-001",
          clinicalStatus: {
            coding: [{ code: "active" }]
          },
          code: {
            text: "Diabetes"
          }
        }
      }
    ]
  };

  const referrals = transformFHIRToReferrals(bundle);

  assert.equal(referrals.length, 1);

  assert.equal(
    referrals[0].targetDepartment,
    "Endocrinology"
  );

  assert.equal(
    referrals[0].patientId,
    "PAT-001"
  );

  // Reprocessing the same data produces the same ID.
  const repeated = transformFHIRToReferrals(bundle);

  assert.equal(
    referrals[0].referralId,
    repeated[0].referralId
  );
});

test("ignores inactive conditions", () => {
  const bundle = {
    resourceType: "Bundle",
    entry: [
      {
        resource: {
          resourceType: "Patient",
          id: "PAT-002"
        }
      },
      {
        resource: {
          resourceType: "Condition",
          id: "COND-002",
          clinicalStatus: {
            coding: [{ code: "resolved" }]
          },
          code: {
            text: "Diabetes"
          }
        }
      }
    ]
  };

  const referrals = transformFHIRToReferrals(bundle);

  assert.equal(referrals.length, 0);
});
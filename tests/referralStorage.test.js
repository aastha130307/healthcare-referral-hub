
const assert = require("node:assert/strict");
const {
  saveReferralWithClient
} = require("../src/services/referralStorage");

const referral = {
  referralId: "REF-TEST-FAILURE-001",
  patientId: "SYN-TEST-001",
  sourceDepartment: "General Medicine",
  targetDepartment: "Cardiology"
};

async function run() {
  const storageFailure = new Error("Simulated Storage failure");

  const failingClient = {
    async createEntity() {
      throw storageFailure;
    }
  };

  await assert.rejects(
    saveReferralWithClient(failingClient, referral),
    (error) => error === storageFailure
  );
  console.log("PASS: Unexpected Storage errors are rethrown.");

  const duplicateClient = {
    async createEntity() {
      const error = new Error("Entity already exists");
      error.statusCode = 409;
      throw error;
    }
  };

  assert.deepEqual(
    await saveReferralWithClient(duplicateClient, referral),
    { saved: false, duplicate: true }
  );
  console.log("PASS: Duplicate Storage errors are handled safely.");

  const successfulClient = {
    async createEntity(entity) {
      assert.equal(entity.rowKey, referral.referralId);
      assert.equal(entity.partitionKey, "REFERRALS");
    }
  };

  assert.deepEqual(
    await saveReferralWithClient(successfulClient, referral),
    { saved: true, duplicate: false }
  );
  console.log("PASS: Successful Storage writes are reported correctly.");
}

run().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});

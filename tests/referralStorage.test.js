
const assert = require("node:assert/strict");

const {
  saveReferralWithClient,
  saveReferralAndOutboxWithClient
} = require("../src/services/referralStorage");

const referral = {
  referralId: "REF-TEST-FAILURE-001",
  patientId: "SYN-TEST-001",
  sourceDepartment: "General Medicine",
  targetDepartment: "Cardiology"
};

async function run() {
  // Test 1: Unexpected Storage errors are rethrown.
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

  // Test 2: Duplicate Storage records are handled safely.
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

  // Test 3: Successful Storage writes are reported correctly.
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

  // Test 4: Referral and outbox are submitted in one transaction.
  let submittedOperations;

  const transactionClient = {
    async submitTransaction(operations) {
      submittedOperations = operations;
    }
  };

  const transactionResult = await saveReferralAndOutboxWithClient(
    transactionClient,
    referral
  );

  assert.deepEqual(transactionResult, {
    saved: true,
    duplicate: false
  });

  assert.equal(submittedOperations.length, 2);

  const [referralOperation, outboxOperation] = submittedOperations;

  assert.equal(referralOperation[0], "create");
  assert.equal(referralOperation[1].partitionKey, "REFERRALS");
  assert.equal(referralOperation[1].rowKey, referral.referralId);

  assert.equal(outboxOperation[0], "create");
  assert.equal(outboxOperation[1].partitionKey, "REFERRALS");
  assert.equal(
    outboxOperation[1].rowKey,
    `OUTBOX-${referral.referralId}`
  );
  assert.equal(outboxOperation[1].status, "Pending");
  assert.equal(outboxOperation[1].eventType, "ReferralProcessed");

  console.log("PASS: Referral and outbox are submitted in one transaction.");

  // Test 5: Unexpected transaction failures are rethrown.
  const transactionFailure = new Error(
    "Simulated transaction failure"
  );

  const failingTransactionClient = {
    async submitTransaction() {
      throw transactionFailure;
    }
  };

  await assert.rejects(
    saveReferralAndOutboxWithClient(
      failingTransactionClient,
      referral
    ),
    (error) => error === transactionFailure
  );

  console.log("PASS: Unexpected transaction failures are rethrown.");

  // Test 6: Duplicate transaction errors are handled safely.
  const duplicateTransactionClient = {
    async submitTransaction() {
      const error = new Error("Entity already exists");
      error.statusCode = 409;
      throw error;
    }
  };

  assert.deepEqual(
    await saveReferralAndOutboxWithClient(
      duplicateTransactionClient,
      referral
    ),
    { saved: false, duplicate: true }
  );

  console.log("PASS: Duplicate transaction errors are handled.");
}

run().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});

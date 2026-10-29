
const assert = require("node:assert/strict");

const {
  publishOutboxRecords
} = require("../src/functions/publishOutbox");

async function run() {
  const records = [
    {
      rowKey: "OUTBOX-REF-1",
      referralId: "REF-1",
      eventType: "ReferralProcessed",
      patientId: "SYN-1",
      sourceDepartment: "General Medicine",
      targetDepartment: "Cardiology",
      priority: "High"
    },
    {
      rowKey: "OUTBOX-REF-2",
      referralId: "REF-2",
      eventType: "ReferralProcessed",
      patientId: "SYN-2",
      sourceDepartment: "General Medicine",
      targetDepartment: "Neurology",
      priority: "Routine"
    }
  ];

  const publishedKeys = [];
  const errors = [];

  const sender = {
    async sendMessages(message) {
      if (message.body.referralId === "REF-2") {
        throw new Error("Simulated Service Bus failure");
      }
    }
  };

  const result = await publishOutboxRecords(
    records,
    sender,
    async (rowKey) => {
      publishedKeys.push(rowKey);
    },
    {
      error: (message) => errors.push(message)
    }
  );

  assert.deepEqual(result, {
    published: 1,
    failed: 1
  });

  assert.deepEqual(publishedKeys, [
    "OUTBOX-REF-1"
  ]);

  assert.equal(errors.length, 1);

  console.log("PASS: Successful sends are marked Published.");
  console.log("PASS: Failed sends remain eligible for retry.");
}

run().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});

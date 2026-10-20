
const fs = require("fs");
const path = require("path");
const { ServiceBusClient } = require("@azure/service-bus");
const { DefaultAzureCredential } = require("@azure/identity");
const { validateReferral } = require("../utils/validateReferral");

const filePath = path.join(__dirname, "../../data/referrals.json");
const namespace = process.env.SERVICE_BUS_NAMESPACE;
const queueName = "referral-events";
const dryRun = process.argv.includes("--dry-run");
const testOnly = process.argv.includes("--test-only");

async function publishReferralBatch() {
  if (!namespace) {
    throw new Error("SERVICE_BUS_NAMESPACE is not configured.");
  }

  const referrals = JSON.parse(fs.readFileSync(filePath, "utf8"));

  // --test-only selects one dedicated test referral from the file.
  const batch = testOnly
    ? referrals.filter((r) => r.referralId === "REF-DAY7-DUP-001")
    : referrals.slice(0, 3);

  if (testOnly && batch.length === 0) {
    throw new Error(
      "Test referral REF-DAY7-DUP-001 was not found in data/referrals.json."
    );
  }

  let validCount = 0;
  let invalidCount = 0;
  let sentCount = 0;

  for (const referral of batch) {
    const result = validateReferral(referral);

    if (!result.isValid) {
      invalidCount++;
      console.log(
        `REJECTED: ${referral.referralId} | ${result.missingFields.join(", ")}`
      );
      continue;
    }

    validCount++;

    if (dryRun) {
      console.log(`DRY RUN: ${referral.referralId} is valid; not sent.`);
      continue;
    }

    const client = new ServiceBusClient(
      namespace,
      new DefaultAzureCredential()
    );

    const sender = client.createSender(queueName);

    try {
      await sender.sendMessages({
        body: referral,
        contentType: "application/json",
        messageId: referral.referralId
      });
      sentCount++;
      console.log(`SENT: ${referral.referralId}`);
    } finally {
      await sender.close();
      await client.close();
    }
  }

  console.log("\nBatch summary");
  console.log(`Valid: ${validCount}`);
  console.log(`Sent to Azure: ${sentCount}`);
  console.log(`Invalid: ${invalidCount}`);
}

publishReferralBatch().catch((error) => {
  console.error("Publisher failed:", error.message);
  process.exitCode = 1;
});

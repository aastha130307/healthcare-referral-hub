const fs = require("fs");
const path = require("path");
const { ServiceBusClient } = require("@azure/service-bus");
const { DefaultAzureCredential } = require("@azure/identity");
const { validateReferral } = require("../utils/validateReferral");

const filePath = path.join(
  __dirname,
  "../../data/referrals.json"
);

const fullyQualifiedNamespace =
  process.env.SERVICE_BUS_NAMESPACE;

const dryRun = process.argv.includes("--dry-run");

const queueName = "referral-events";

async function publishReferralBatch() {
  if (!fullyQualifiedNamespace) {
    throw new Error(
      "SERVICE_BUS_NAMESPACE is not configured."
    );
  }

  const referrals = JSON.parse(
    fs.readFileSync(filePath, "utf8")
  );
  if (dryRun) {
  const referrals = JSON.parse(
    fs.readFileSync(filePath, "utf8")
  );

  const batch = referrals.slice(0, 3);
  let validCount = 0;

  for (const referral of batch) {
    const result = validateReferral(referral);

    if (result.isValid) {
      validCount++;
      console.log(`DRY RUN: ${referral.referralId} is valid.`);
    } else {
      console.log(
        `REJECTED: ${referral.referralId} | ${result.missingFields.join(", ")}`
      );
    }
  }

  console.log(`Valid: ${validCount}`);
  console.log("Azure messages sent: 0");
  return;
}
  const credential = new DefaultAzureCredential();

  const client = new ServiceBusClient(
    fullyQualifiedNamespace,
    credential
  );

  const sender = client.createSender(queueName);

  let sentCount = 0;
  let invalidCount = 0;

  try {
    for (const referral of referrals.slice(0, 3)) {
      const result = validateReferral(referral);

      if (!result.isValid) {
        invalidCount++;
        console.log(
          `REJECTED: ${referral.referralId} | ` +
          result.missingFields.join(", ")
        );
        continue;
      }

      if (dryRun) {
  console.log(`DRY RUN: ${referral.referralId} is valid and ready.`);
} else {
  await sender.sendMessages({
    body: referral,
    contentType: "application/json",
    messageId: referral.referralId
  });

  console.log(`SENT: ${referral.referralId}`);
}

sentCount++;
  }}finally {
    await sender.close();
    await client.close();
  }

  console.log("\nBatch summary");
  console.log(`Sent to Azure: ${sentCount}`);
  console.log(`Invalid: ${invalidCount}`);
}

publishReferralBatch().catch((error) => {
  console.error("Publisher failed:", error.message);
  process.exitCode = 1;
});
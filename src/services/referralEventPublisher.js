
const { ServiceBusClient } = require("@azure/service-bus");

let client;
let sender;

async function publishReferralProcessed(referral) {
  if (!sender) {
    const namespace = process.env.SERVICE_BUS_NAMESPACE;

    if (!namespace) {
      throw new Error("SERVICE_BUS_NAMESPACE is not configured");
    }

    client = new ServiceBusClient(
      namespace,
      new (require("@azure/identity").DefaultAzureCredential)()
    );

    sender = client.createSender("processed-referrals");
  }

  const event = {
    eventType: "ReferralProcessed",
    referralId: referral.referralId,
    patientId: referral.patientId,
    sourceDepartment: referral.sourceDepartment,
    targetDepartment: referral.targetDepartment,
    priority: referral.priority,
    status: "Processed",
    processedAt: new Date().toISOString()
  };

  await sender.sendMessages({
    body: event,
    messageId: `processed-${referral.referralId}`,
    contentType: "application/json"
  });

  return event;
}

module.exports = { publishReferralProcessed };

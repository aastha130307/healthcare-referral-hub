
const { app } = require("@azure/functions");
const { ServiceBusClient } = require("@azure/service-bus");
const { DefaultAzureCredential } = require("@azure/identity");

const {
  getPendingOutbox,
  markOutboxPublished
} = require("../services/referralStorage");

let client;
let sender;

async function getSender() {
  if (!sender) {
    const namespace = process.env.SERVICE_BUS_NAMESPACE;

    if (!namespace) {
      throw new Error("SERVICE_BUS_NAMESPACE is not configured.");
    }

    client = new ServiceBusClient(
      namespace,
      new DefaultAzureCredential()
    );

    sender = client.createSender("processed-referrals");
  }

  return sender;
}

async function publishOutboxRecords(
  records,
  serviceBusSender,
  markPublished,
  context
) {
  let published = 0;
  let failed = 0;

  for (const record of records) {
    try {
      const event = {
        eventType: record.eventType,
        referralId: record.referralId,
        patientId: record.patientId,
        sourceDepartment: record.sourceDepartment,
        targetDepartment: record.targetDepartment,
        priority: record.priority,
        status: "Processed",
        processedAt: new Date().toISOString()
      };

      await serviceBusSender.sendMessages({
        body: event,
        messageId: `processed-${record.referralId}`,
        contentType: "application/json"
      });

      await markPublished(record.rowKey);
      published++;

    } catch (error) {
      failed++;

      context.error(
        `Failed to publish ${record.rowKey}: ${error.message}`
      );
    }
  }

  return { published, failed };
}

app.timer("PublishOutbox", {
  schedule: "0 */1 * * * *",
  runOnStartup: false,
  useMonitor: true,

  handler: async (myTimer, context) => {
    const records = await getPendingOutbox();
    context.log(`Found ${records.length} pending outbox record(s).`);

    if (records.length === 0) {
      return;
    }

    const serviceBusSender = await getSender();

    const result = await publishOutboxRecords(
      records,
      serviceBusSender,
      markOutboxPublished,
      context
    );

    context.log(
      `Outbox run complete. Published: ${result.published}; failed: ${result.failed}.`
    );
  }
});

module.exports = { publishOutboxRecords };

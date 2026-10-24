
const { app } = require("@azure/functions");
const { ServiceBusClient } = require("@azure/service-bus");
const { DefaultAzureCredential } = require("@azure/identity");

const {
  transformFHIRToReferrals
} = require("../utils/transformFHIRToReferrals");

const {
  validateReferral
} = require("../utils/validateReferral");

const queueName = "referral-events";

app.storageBlob("ProcessFHIRBlob", {
  path: "incoming-fhir/{name}",
  connection: "AzureWebJobsStorage",

  handler: async (blob, context) => {
    const filename = context.triggerMetadata.name;

    context.log(`FHIR file detected: ${filename}`);

    if (!filename.toLowerCase().endsWith(".json")) {
      context.log("Skipping non-JSON file");
      return;
    }

    const namespace = process.env.SERVICE_BUS_NAMESPACE;

    if (!namespace) {
      throw new Error("SERVICE_BUS_NAMESPACE is missing");
    }

    let client;
    let sender;

    try {
      // Step 1: Read uploaded JSON
      const jsonText = Buffer.isBuffer(blob)
        ? blob.toString("utf8")
        : String(blob);

      const bundle = JSON.parse(jsonText);

      // Step 2: Transform FHIR into referrals
      const referrals = transformFHIRToReferrals(bundle);

      context.log(`Generated ${referrals.length} referrals`);

      // Step 3: Validate generated referrals
      const validReferrals = [];

      for (const referral of referrals) {
        const result = validateReferral(referral);

        if (!result.isValid) {
          context.warn(
            `Invalid referral ${referral.referralId}: ` +
            result.missingFields.join(", ")
          );
          continue;
        }

        validReferrals.push(referral);
      }

      if (validReferrals.length === 0) {
        context.log("No valid referrals to publish");
        return;
      }

      // Step 4: Connect to Azure Service Bus
      client = new ServiceBusClient(
        namespace,
        new DefaultAzureCredential()
      );

      sender = client.createSender(queueName);

      // Step 5: Publish each valid referral
      for (const referral of validReferrals) {
        await sender.sendMessages({
          body: referral,
          contentType: "application/json",
          messageId: referral.referralId
        });

        context.log(`SENT: ${referral.referralId}`);
      }

      context.log(
        `Successfully published ${validReferrals.length} referrals`
      );

    } catch (error) {
      context.error(
        `FHIR processing or publishing failed: ${error.message}`
      );

      throw error;

    } finally {
      if (sender) await sender.close();
      if (client) await client.close();
    }
  }
});


const { app } = require("@azure/functions");
const { DefaultAzureCredential } = require("@azure/identity");
const { ServiceBusClient } = require("@azure/service-bus");
const { randomUUID } = require("node:crypto");
const { validateReferral } = require("../utils/validateReferral");

app.http("CreateReferral", {
  methods: ["POST"],
  authLevel: "function",
  route: "referrals",

  handler: async (request, context) => {
    try {
      const body = await request.json();

      const referral = {
        referralId: randomUUID(),
        patientId: body.patientId,
        sourceDepartment: body.sourceDepartment,
        targetDepartment: body.targetDepartment,
        priority: body.priority || "Normal",
        createdAt: new Date().toISOString()
      };

      const validation = validateReferral(referral);

      if (!validation.isValid) {
        return {
          status: 400,
          jsonBody: {
            error: "Invalid referral",
            missingFields: validation.missingFields
          }
        };
      }

      const namespace =
        process.env.SERVICE_BUS_NAMESPACE ||
        process.env.ServiceBusConnection__fullyQualifiedNamespace;

      if (!namespace) {
        throw new Error("Service Bus namespace is not configured");
      }

      const client = new ServiceBusClient(
        namespace,
        new DefaultAzureCredential()
      );

      const sender = client.createSender("referral-events");

      try {
        await sender.sendMessages({
          body: referral,
          messageId: referral.referralId,
          contentType: "application/json"
        });
      } finally {
        await sender.close();
        await client.close();
      }

      context.log("Referral published:", referral.referralId);

      return {
        status: 202,
        jsonBody: {
          message: "Referral accepted for processing",
          referralId: referral.referralId,
          status: "Queued"
        }
      };

    } catch (error) {
      context.error("Referral submission failed:", error);

      return {
        status: 500,
        jsonBody: {
          error: "Unable to submit referral"
        }
      };
    }
  }
});

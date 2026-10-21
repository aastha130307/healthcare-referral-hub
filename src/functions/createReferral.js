
const { app } = require("@azure/functions");
const { DefaultAzureCredential } = require("@azure/identity");
const { ServiceBusClient } = require("@azure/service-bus");
const { randomUUID } = require("node:crypto");
const { validateReferral } = require("../utils/validateReferral");

app.http("CreateReferral", {
  methods: ["POST"],
  authLevel: "anonymous",
  route: "referrals",

  handler: async (request, context) => {
    try {
      // Azure App Service Authentication supplies these
      // headers after validating the access token.
      const principalId = request.headers.get(
        "x-ms-client-principal-id"
      );

      const principalEncoded = request.headers.get(
        "x-ms-client-principal"
      );

      if (!principalId || !principalEncoded) {
        return {
          status: 401,
          jsonBody: { error: "Authentication required" }
        };
      }

      let principal;

      try {
        principal = JSON.parse(
          Buffer.from(principalEncoded, "base64").toString("utf8")
        );
      } catch {
        return {
          status: 401,
          jsonBody: { error: "Invalid authentication context" }
        };
      }

      const claims = principal.claims || [];

      const scopes = claims
        .filter((claim) =>
          claim.typ === "scp" ||
          claim.typ === "http://schemas.microsoft.com/identity/claims/scope"
        )
        .flatMap((claim) => claim.val.split(" "));

      if (!scopes.includes("Referral.Submit")) {
        return {
          status: 403,
          jsonBody: {
            error: "Referral.Submit permission required"
          }
        };
      }

      // TODO: Restrict submission to approved demo doctors
      // using a verified tenant identity or app role.

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

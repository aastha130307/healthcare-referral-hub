const { app } = require("@azure/functions");
const { validateReferral } = require("../utils/validateReferral");
const {
  saveReferralAndOutbox
} = require("../services/referralStorage");

app.serviceBusQueue("ProcessReferralMessage", {
  connection: "ServiceBusConnection",
  queueName: "referral-events",

  handler: async (message, context) => {
    const referralId =
      typeof message?.referralId === "string" &&
      message.referralId.trim()
        ? message.referralId
        : "unknown";

    const invocationId = context.invocationId ?? "unknown";

    // Record that processing has started.
    context.log(JSON.stringify({
      event: "ReferralReceived",
      referralId,
      invocationId
    }));

    // Validate the incoming referral.
    const result = validateReferral(message);

    if (!result.isValid) {
      const errorMessage =
        `Invalid referral. Missing fields: ${result.missingFields.join(", ")}`;

      context.error(JSON.stringify({
        event: "ReferralValidationFailed",
        errorType: "PERMANENT_VALIDATION_ERROR",
        referralId,
        invocationId,
        missingFields: result.missingFields
      }));

      throw new Error(errorMessage);
    }

    try {
      // Save the referral and outbox record in one transaction.
      const outcome = await saveReferralAndOutbox(message);

      if (outcome.duplicate) {
        context.log(JSON.stringify({
          event: "ReferralDuplicateIgnored",
          referralId,
          invocationId,
          outcome: "Duplicate"
        }));

        return;
      }

      context.log(JSON.stringify({
        event: "ReferralAndOutboxSaved",
        referralId,
        invocationId,
        outcome: "Success"
      }));

    } catch (error) {
      context.error(JSON.stringify({
        event: "ReferralPersistenceFailed",
        referralId,
        invocationId,
        errorMessage: error.message
      }));

      // Preserve the existing retry behavior for unexpected failures.
      throw error;
    }
  }
});

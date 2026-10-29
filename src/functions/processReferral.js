
const { app } = require("@azure/functions");
const { validateReferral } = require("../utils/validateReferral");
const {
  saveReferralAndOutbox
} = require("../services/referralStorage");

app.serviceBusQueue("ProcessReferralMessage", {
  connection: "ServiceBusConnection",
  queueName: "referral-events",

  handler: async (message, context) => {
    const result = validateReferral(message);

    if (!result.isValid) {
      const errorMessage =
        `Invalid referral. Missing fields: ${result.missingFields.join(", ")}`;

      context.error(JSON.stringify({
        errorType: "PERMANENT_VALIDATION_ERROR",
        referralId: message?.referralId ?? "unknown",
        missingFields: result.missingFields,
        message: errorMessage
      }));

      throw new Error(errorMessage);
    }

    const outcome = await saveReferralAndOutbox(message);

    if (outcome.duplicate) {
      context.log(
        `Duplicate referral ignored: ${message.referralId}`
      );
      return;
    }

    context.log(
      `Referral and outbox saved atomically: ${message.referralId}`
    );
  }
});

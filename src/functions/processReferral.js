
const { app } = require("@azure/functions");
const { validateReferral } = require("../utils/validateReferral");
const { saveReferral } = require("../services/referralStorage");
const {
  publishReferralProcessed
} = require("../services/referralEventPublisher");

app.serviceBusQueue("ProcessReferralMessage", {
  connection: "ServiceBusConnection",
  queueName: "referral-events",

  handler: async (message, context) => {
    
const result = validateReferral(message);

if (!result.isValid) {
  const errorMessage =
    `Invalid referral. Missing fields: ${result.missingFields.join(", ")}`;

  context.error(
    JSON.stringify({
      errorType: "PERMANENT_VALIDATION_ERROR",
      referralId: message?.referralId ?? "unknown",
      missingFields: result.missingFields,
      message: errorMessage
    })
  );

  throw new Error(errorMessage);
}


    const outcome = await saveReferral(message);

    if (outcome.duplicate) {
      context.log(
        `Duplicate referral ignored: ${message.referralId}`
      );
      return;
    }

    context.log(
      `Referral ${message.referralId} saved successfully to ReferralRecords.`
    );

    const event = await publishReferralProcessed(message);

    context.log(
      `ReferralProcessed event published: ${event.referralId}`
    );
  }
});

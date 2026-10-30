const { app } = require("@azure/functions");

const patients = require("../../data/patients.json");

app.http("GetPatients", {
  methods: ["GET"],
  authLevel: "anonymous",
  route: "patients",

  handler: async (request, context) => {
    context.log(
      JSON.stringify({
        event: "PatientsFetched",
        count: patients.length
      })
    );

    return {
      status: 200,
      jsonBody: {
        count: patients.length,
        patients
      }
    };
  }
});
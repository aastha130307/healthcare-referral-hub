
const { app } = require("@azure/functions");

const patients = [
  {
    patientId: "SYN-PAT-001",
    name: "Demo Patient One",
    age: 45,
    gender: "Female"
  },
  {
    patientId: "SYN-PAT-002",
    name: "Demo Patient Two",
    age: 52,
    gender: "Male"
  },
  {
    patientId: "SYN-PAT-003",
    name: "Demo Patient Three",
    age: 38,
    gender: "Female"
  }
];

app.http("GetPatients", {
  methods: ["GET"],
  authLevel: "function",
  route: "patients",

  handler: async (request, context) => {
    context.log("Fetching synthetic patients");

    return {
      status: 200,
      jsonBody: {
        count: patients.length,
        patients
      }
    };
  }
});

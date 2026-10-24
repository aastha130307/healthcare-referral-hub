const crypto = require("crypto");


const departmentRules = [
  {
    keywords: ["diabetes", "prediabetes", "hyperglycemia"],
    department: "Endocrinology"
  },
  {
    keywords: ["anemia"],
    department: "Hematology"
  },
  {
    keywords: ["obesity", "metabolic syndrome"],
    department: "General Medicine"
  },
  {
    keywords: ["hyperlipidemia", "hypertriglyceridemia"],
    department: "Cardiology"
  }
];

function getDisplay(resource) {
  return (
    resource.code?.text ||
    resource.code?.coding?.find((item) => item.display)?.display ||
    ""
  );
}

function getDestination(conditionName) {
  const name = conditionName.toLowerCase();

  const rule = departmentRules.find((item) =>
    item.keywords.some((keyword) => name.includes(keyword))
  );

  return rule?.department || "General Medicine";
}

function transformFHIRToReferrals(bundle) {
  if (
    !bundle ||
    bundle.resourceType !== "Bundle" ||
    !Array.isArray(bundle.entry)
  ) {
    throw new Error("Invalid FHIR Bundle");
  }

  const resources = bundle.entry
    .map((entry) => entry.resource)
    .filter(Boolean);

  const patient = resources.find(
    (resource) => resource.resourceType === "Patient"
  );

  if (!patient?.id) {
    throw new Error("FHIR Bundle has no valid Patient");
  }

  const conditions = resources.filter(
    (resource) =>
      resource.resourceType === "Condition" &&
      resource.clinicalStatus?.coding?.some(
        (coding) => coding.code === "active"
      )
  );

  const referrals = [];
  const seen = new Set();

  for (const condition of conditions) {
    const conditionName = getDisplay(condition);

    if (!conditionName) continue;

   
    const conditionKey = condition.id ||
      `${conditionName}:${condition.onsetDateTime || ""}`;

    const key = `${patient.id}:${conditionKey}`;

    if (seen.has(key)) continue;
    seen.add(key);

    const hash = crypto
      .createHash("sha256")
      .update(key)
      .digest("hex")
      .slice(0, 20);

    referrals.push({
      referralId: `SYN-REF-${hash}`,
      patientId: patient.id,
      sourceDepartment: "General Medicine",
      targetDepartment: getDestination(conditionName),
      priority: "Routine",
      sourceCondition: conditionName,
      sourceType: "Synthea-derived demo event"
    });
  }

  return referrals;
}

module.exports = { transformFHIRToReferrals };
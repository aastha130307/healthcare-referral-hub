
const fs = require("fs");
const path = require("path");

const inputDirectory = path.join(
  process.env.USERPROFILE,
  "output",
  "fhir"
);

const outputFile = path.join(
  __dirname,
  "../../data/referrals.json"
);

// Explicit demo mappings, not clinical recommendations.
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

function main() {
  if (!fs.existsSync(inputDirectory)) {
    throw new Error(`Synthea directory not found: ${inputDirectory}`);
  }

  const files = fs.readdirSync(inputDirectory).filter(
    (name) =>
      name.endsWith(".json") &&
      !name.includes("Information")
  );

  const referrals = [];
  const seen = new Set();

  for (const filename of files) {
    const fullPath = path.join(inputDirectory, filename);
    const bundle = JSON.parse(fs.readFileSync(fullPath, "utf8"));

    const resources = (bundle.entry || []).map(
      (entry) => entry.resource
    );

    const patient = resources.find(
      (resource) => resource.resourceType === "Patient"
    );

    if (!patient) continue;

    const conditions = resources.filter(
      (resource) =>
        resource.resourceType === "Condition" &&
        resource.clinicalStatus?.coding?.some(
          (coding) => coding.code === "active"
        )
    );

    for (const condition of conditions) {
      const conditionName = getDisplay(condition);
      if (!conditionName) continue;

      const key = `${patient.id}:${condition.id}`;
      if (seen.has(key)) continue;
      seen.add(key);

      referrals.push({
        referralId: `SYN-REF-${String(referrals.length + 1).padStart(5, "0")}`,
        patientId: patient.id,
        sourceDepartment: "General Medicine",
        targetDepartment: getDestination(conditionName),
        priority: "Routine",
        sourceCondition: conditionName,
        sourceType: "Synthea-derived demo event"
      });
    }
  }

  fs.mkdirSync(path.dirname(outputFile), { recursive: true });
  fs.writeFileSync(outputFile, JSON.stringify(referrals, null, 2));

  console.log(`FHIR files inspected: ${files.length}`);
  console.log(`Synthetic demo events generated: ${referrals.length}`);
  console.log(`Output: ${outputFile}`);
}

main();

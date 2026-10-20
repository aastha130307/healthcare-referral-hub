const { isDuplicateEntityError } = require("../utils/handleStorageConflict");
const { TableClient } = require("@azure/data-tables");
const { DefaultAzureCredential } = require("@azure/identity");

const accountName = process.env.TABLE_STORAGE_ACCOUNT;
const tableName = "ReferralRecords";

if (!accountName) {
  throw new Error("TABLE_STORAGE_ACCOUNT is not configured.");
}

const endpoint = `https://${accountName}.table.core.windows.net`;

const tableClient = new TableClient(
  endpoint,
  tableName,
  new DefaultAzureCredential()
);


async function saveReferral(referral) {
  const entity = {
    partitionKey: "REFERRALS",
    rowKey: referral.referralId,
    patientId: referral.patientId,
    sourceDepartment: referral.sourceDepartment,
    targetDepartment: referral.targetDepartment,
    priority: referral.priority || "Routine",
    status: "Validated",
    createdAt: new Date().toISOString()
  };

  try {
    await tableClient.createEntity(entity);

    return {
      saved: true,
      duplicate: false
    };
  } catch (error) {
    if (isDuplicateEntityError(error)) {
      return {
        saved: false,
        duplicate: true
      };
    }

    throw error;
  }
}


module.exports = { saveReferral };

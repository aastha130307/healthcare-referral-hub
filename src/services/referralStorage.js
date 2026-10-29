
const { isDuplicateEntityError } = require("../utils/handleStorageConflict");
const { TableClient } = require("@azure/data-tables");
const { DefaultAzureCredential } = require("@azure/identity");

function createReferralTableClient() {
  const accountName = process.env.TABLE_STORAGE_ACCOUNT;

  if (!accountName) {
    throw new Error("TABLE_STORAGE_ACCOUNT is not configured.");
  }

  const endpoint = `https://${accountName}.table.core.windows.net`;

  return new TableClient(
    endpoint,
    "ReferralRecords",
    new DefaultAzureCredential()
  );
}

async function saveReferralWithClient(tableClient, referral) {
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

    return { saved: true, duplicate: false };
  } catch (error) {
    if (isDuplicateEntityError(error)) {
      return { saved: false, duplicate: true };
    }

    throw error;
  }
}

async function saveReferralAndOutboxWithClient(tableClient, referral) {
  const now = new Date().toISOString();

  const referralEntity = {
    partitionKey: "REFERRALS",
    rowKey: referral.referralId,
    patientId: referral.patientId,
    sourceDepartment: referral.sourceDepartment,
    targetDepartment: referral.targetDepartment,
    priority: referral.priority || "Routine",
    status: "Validated",
    createdAt: now
  };

  const outboxEntity = {
    partitionKey: "REFERRALS",
    rowKey: `OUTBOX-${referral.referralId}`,
    eventType: "ReferralProcessed",
    referralId: referral.referralId,
    patientId: referral.patientId,
    sourceDepartment: referral.sourceDepartment,
    targetDepartment: referral.targetDepartment,
    priority: referral.priority || "Routine",
    status: "Pending",
    createdAt: now
  };

  try {
    await tableClient.submitTransaction([
      ["create", referralEntity],
      ["create", outboxEntity]
    ]);

    return { saved: true, duplicate: false };
  } catch (error) {
    if (isDuplicateEntityError(error)) {
      return { saved: false, duplicate: true };
    }

    throw error;
  }
}

// Read pending outbox records using an injected client.
// Injection makes this function easy to test without Azure.
async function getPendingOutboxWithClient(tableClient) {
  const pendingRecords = [];

  const entities = tableClient.listEntities({
    queryOptions: {
      filter: "PartitionKey eq 'REFERRALS' and status eq 'Pending'"
    }
  });

  for await (const entity of entities) {
    if (String(entity.rowKey).startsWith("OUTBOX-")) {
      pendingRecords.push(entity);
    }
  }

  return pendingRecords;
}

async function getPendingOutbox() {
  const tableClient = createReferralTableClient();

  return getPendingOutboxWithClient(tableClient);
}

async function saveReferral(referral) {
  const tableClient = createReferralTableClient();

  return saveReferralWithClient(tableClient, referral);
}


async function markOutboxPublished(rowKey) {
  const tableClient = createReferralTableClient();

  await tableClient.updateEntity(
    {
      partitionKey: "REFERRALS",
      rowKey,
      status: "Published",
      publishedAt: new Date().toISOString()
    },
    "Merge"
  );
}


async function saveReferralAndOutbox(referral) {
  const tableClient = createReferralTableClient();

  return saveReferralAndOutboxWithClient(tableClient, referral);
}



module.exports = {
  saveReferral,
  saveReferralWithClient,
  saveReferralAndOutboxWithClient,
  getPendingOutbox,
  getPendingOutboxWithClient,
  markOutboxPublished,
  saveReferralAndOutbox
};

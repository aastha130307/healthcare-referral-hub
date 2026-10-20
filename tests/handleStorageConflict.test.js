
const assert = require("node:assert/strict");
const { isDuplicateEntityError } = require("../src/utils/handleStorageConflict");

assert.equal(
  isDuplicateEntityError({ statusCode: 409 }),
  true
);

assert.equal(
  isDuplicateEntityError({ code: "EntityAlreadyExists" }),
  true
);

assert.equal(
  isDuplicateEntityError({ statusCode: 500 }),
  false
);

assert.equal(
  isDuplicateEntityError(new Error("Network failure")),
  false
);

console.log("PASS: HTTP 409 is recognized as a duplicate.");
console.log("PASS: EntityAlreadyExists is recognized as a duplicate.");
console.log("PASS: Unexpected errors are not treated as duplicates.");

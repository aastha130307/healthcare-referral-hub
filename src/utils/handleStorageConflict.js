function isDuplicateEntityError(error) {
  return (
    error.statusCode === 409 ||
    error.code === "EntityAlreadyExists"
  );
}

module.exports = { isDuplicateEntityError };

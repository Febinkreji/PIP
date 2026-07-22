// rawRow is a plain object (not an array), so node-postgres serializes it to
// JSON text on its own — but we stringify explicitly here to stay consistent
// with parseJsonField's approach elsewhere in this framework and to avoid
// relying on that implicit behavior.
async function recordRowError(client, { importJobId, dataset, rowNumber, errorType, errorMessage, rawRow }) {
  await client.query(
    `INSERT INTO import_errors (import_job_id, dataset, row_number, error_type, error_message, raw_row)
     VALUES ($1, $2, $3, $4, $5, $6)`,
    [
      importJobId,
      dataset,
      rowNumber,
      errorType,
      errorMessage,
      rawRow ? JSON.stringify(rawRow) : null,
    ]
  )
}

module.exports = { recordRowError }

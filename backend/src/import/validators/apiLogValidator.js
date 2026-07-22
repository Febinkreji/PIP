// Mirrors the NOT NULL columns on api_logs in schema.sql.
const REQUIRED_FIELDS = ['request_id', 'merchant_id', 'request_ts']

function validate(record) {
  const errors = REQUIRED_FIELDS
    .filter((field) => record[field] === null || record[field] === undefined)
    .map((field) => `${field} is required`)

  return { valid: errors.length === 0, errors }
}

module.exports = { validate, REQUIRED_FIELDS }

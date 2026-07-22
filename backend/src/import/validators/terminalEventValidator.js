// Mirrors the NOT NULL columns on terminal_events in schema.sql.
const REQUIRED_FIELDS = ['event_id', 'terminal_id', 'event', 'merchant_id', 'created_at']

function validate(record) {
  const errors = REQUIRED_FIELDS
    .filter((field) => record[field] === null || record[field] === undefined)
    .map((field) => `${field} is required`)

  return { valid: errors.length === 0, errors }
}

module.exports = { validate, REQUIRED_FIELDS }

// Mirrors the NOT NULL columns on payments in schema.sql.
const REQUIRED_FIELDS = [
  'payment_id', 'amount', 'merchant_id', 'payment_type', 'payment_status', 'created_at',
]

function validate(record) {
  const errors = REQUIRED_FIELDS
    .filter((field) => record[field] === null || record[field] === undefined)
    .map((field) => `${field} is required`)

  return { valid: errors.length === 0, errors }
}

module.exports = { validate, REQUIRED_FIELDS }

// Mirrors the NOT NULL columns on orders in schema.sql.
const REQUIRED_FIELDS = ['order_id', 'merchant_id', 'order_status', 'total_amount', 'created_at']

function validate(record) {
  const errors = REQUIRED_FIELDS
    .filter((field) => record[field] === null || record[field] === undefined)
    .map((field) => `${field} is required`)

  return { valid: errors.length === 0, errors }
}

module.exports = { validate, REQUIRED_FIELDS }

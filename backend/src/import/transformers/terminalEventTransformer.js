const { emptyToNull } = require('../utils/emptyToNull')
const { parseJsonField } = require('../utils/parseJsonField')
const { parseTimestamp } = require('../utils/parseTimestamp')

const TABLE_NAME = 'terminal_events'

const COLUMNS = [
  'event_id', 'terminal_id', 'event', 'event_body', 'legacy_timestamp',
  'merchant_id', 'transaction_id', 'order_id', 'reference_id', 'created_at',
  'event_timestamp', 'created_by', 'import_job_id',
]

function safeJson(field, value, warnings) {
  try {
    return parseJsonField(value)
  } catch (err) {
    warnings.push(`${field}: invalid JSON (${err.message})`)
    return null
  }
}

// rawRow.timestamp -> legacy_timestamp (renamed to avoid a Postgres
// reserved-word collision; the column was empty in every sample seen).
function transform(rawRow, importJobId) {
  const warnings = []

  const record = {
    event_id: emptyToNull(rawRow.event_id),
    terminal_id: emptyToNull(rawRow.terminal_id),
    event: emptyToNull(rawRow.event),
    event_body: safeJson('event_body', rawRow.event_body, warnings),
    legacy_timestamp: parseTimestamp(rawRow.timestamp),
    merchant_id: emptyToNull(rawRow.merchant_id),
    transaction_id: emptyToNull(rawRow.transaction_id),
    order_id: emptyToNull(rawRow.order_id),
    reference_id: emptyToNull(rawRow.reference_id),
    created_at: parseTimestamp(rawRow.created_at),
    event_timestamp: parseTimestamp(rawRow.event_timestamp),
    created_by: emptyToNull(rawRow.created_by),
    import_job_id: importJobId,
  }

  return { record, warnings }
}

module.exports = { transform, COLUMNS, TABLE_NAME }

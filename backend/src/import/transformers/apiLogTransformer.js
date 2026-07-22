const { emptyToNull } = require('../utils/emptyToNull')
const { parseJsonField } = require('../utils/parseJsonField')
const { parseTimestamp } = require('../utils/parseTimestamp')

const TABLE_NAME = 'api_logs'

const COLUMNS = [
  'request_id', 'request_data', 'request_data_mapped', 'response_data',
  'response_data_mapped', 'merchant_id', 'partner_id', 'api_key', 'api_url',
  'request_ts', 'response_ts', 'call_type', 'gateway_header', 'gateway_request_id',
  'status', 'ip', 'origin', 'query', 'request_time_taken', 'status_code',
  'terminal_id', 'order_id', 'payment_id', 'version', 'import_job_id',
]

function safeJson(field, value, warnings) {
  try {
    return parseJsonField(value)
  } catch (err) {
    warnings.push(`${field}: invalid JSON (${err.message})`)
    return null
  }
}

// request_time_taken/status_code are passed through as validated text —
// Postgres casts the string to NUMERIC/SMALLINT itself, avoiding any JS
// float rounding on the way in.
function transform(rawRow, importJobId) {
  const warnings = []

  const record = {
    request_id: emptyToNull(rawRow.request_id),
    request_data: safeJson('request_data', rawRow.request_data, warnings),
    request_data_mapped: safeJson('request_data_mapped', rawRow.request_data_mapped, warnings),
    response_data: safeJson('response_data', rawRow.response_data, warnings),
    response_data_mapped: safeJson('response_data_mapped', rawRow.response_data_mapped, warnings),
    merchant_id: emptyToNull(rawRow.merchant_id),
    partner_id: emptyToNull(rawRow.partner_id),
    api_key: emptyToNull(rawRow.api_key),
    api_url: emptyToNull(rawRow.api_url),
    request_ts: parseTimestamp(rawRow.request_ts),
    response_ts: parseTimestamp(rawRow.response_ts),
    call_type: emptyToNull(rawRow.call_type),
    gateway_header: emptyToNull(rawRow.gateway_header),
    gateway_request_id: emptyToNull(rawRow.gateway_request_id),
    status: emptyToNull(rawRow.status),
    ip: emptyToNull(rawRow.ip),
    origin: emptyToNull(rawRow.origin),
    query: safeJson('query', rawRow.query, warnings),
    request_time_taken: emptyToNull(rawRow.request_time_taken),
    status_code: emptyToNull(rawRow.status_code),
    terminal_id: emptyToNull(rawRow.terminal_id),
    order_id: emptyToNull(rawRow.order_id),
    payment_id: emptyToNull(rawRow.payment_id),
    version: emptyToNull(rawRow.version),
    import_job_id: importJobId,
  }

  return { record, warnings }
}

module.exports = { transform, COLUMNS, TABLE_NAME }

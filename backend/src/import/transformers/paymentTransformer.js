const { emptyToNull } = require('../utils/emptyToNull')
const { parseJsonField } = require('../utils/parseJsonField')
const { parseTimestamp } = require('../utils/parseTimestamp')
const { parseBigIntString } = require('../utils/parseBigInt')
const { parseBoolean } = require('../utils/parseBoolean')

const TABLE_NAME = 'payments'

const COLUMNS = [
  'payment_id', 'order_id', 'amount', 'merchant_id', 'checkout_id', 'currency',
  'payment_type', 'payment_status', 'payment_method', 'external_request_id',
  'external_request_json', 'external_response_json', 'payee_phone_number',
  'created_at', 'last_updated_at', 'request_id', 'created_by', 'transaction_id',
  'user_message_id', 'terminal_message', 'voided', 'void_requested_at',
  'void_status', 'entry_id', 'store_id', 'card_brand', 'terminal_code_raw',
  'purchase_payment_id', 'reference_payment_id', 'originated_by', 'import_job_id',
]

function safeJson(field, value, warnings) {
  try {
    return parseJsonField(value)
  } catch (err) {
    warnings.push(`${field}: invalid JSON (${err.message})`)
    return null
  }
}

// rawRow.terminal_code (the source JSON-array column) is mapped to
// terminal_code_raw — the destination column name was changed to avoid
// clashing with the new terminal_code dimension table.
function transform(rawRow, importJobId) {
  const warnings = []

  const record = {
    payment_id: emptyToNull(rawRow.payment_id),
    order_id: emptyToNull(rawRow.order_id),
    amount: parseBigIntString(rawRow.amount),
    merchant_id: emptyToNull(rawRow.merchant_id),
    checkout_id: emptyToNull(rawRow.checkout_id),
    currency: emptyToNull(rawRow.currency),
    payment_type: emptyToNull(rawRow.payment_type),
    payment_status: emptyToNull(rawRow.payment_status),
    payment_method: emptyToNull(rawRow.payment_method),
    external_request_id: emptyToNull(rawRow.external_request_id),
    external_request_json: safeJson('external_request_json', rawRow.external_request_json, warnings),
    external_response_json: safeJson('external_response_json', rawRow.external_response_json, warnings),
    payee_phone_number: emptyToNull(rawRow.payee_phone_number),
    created_at: parseTimestamp(rawRow.created_at),
    last_updated_at: parseTimestamp(rawRow.last_updated_at),
    request_id: emptyToNull(rawRow.request_id),
    created_by: emptyToNull(rawRow.created_by),
    transaction_id: emptyToNull(rawRow.transaction_id),
    user_message_id: emptyToNull(rawRow.user_message_id),
    terminal_message: emptyToNull(rawRow.terminal_message),
    voided: parseBoolean(rawRow.voided) ?? false,
    void_requested_at: parseTimestamp(rawRow.void_requested_at),
    void_status: emptyToNull(rawRow.void_status),
    entry_id: emptyToNull(rawRow.entry_id),
    store_id: emptyToNull(rawRow.store_id),
    card_brand: emptyToNull(rawRow.card_brand),
    terminal_code_raw: safeJson('terminal_code', rawRow.terminal_code, warnings),
    purchase_payment_id: emptyToNull(rawRow.purchase_payment_id),
    reference_payment_id: emptyToNull(rawRow.reference_payment_id),
    originated_by: emptyToNull(rawRow.originated_by),
    import_job_id: importJobId,
  }

  return { record, warnings }
}

module.exports = { transform, COLUMNS, TABLE_NAME }

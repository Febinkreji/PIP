const { emptyToNull } = require('../utils/emptyToNull')
const { parseJsonField } = require('../utils/parseJsonField')
const { parseTimestamp } = require('../utils/parseTimestamp')
const { parseBigIntString } = require('../utils/parseBigInt')

const TABLE_NAME = 'orders'

const COLUMNS = [
  'order_id', 'merchant_id', 'terminal_id', 'reference_id', 'currency_code',
  'meta_data', 'order_date', 'order_status', 'currency',
  'campaign_amount', 'shipping_amount', 'regular_amount', 'total_amount',
  'customer_id', 'billing_address_id', 'shipping_address_id',
  'billing_phone_number_id', 'shipping_phone_number_id',
  'billing_email_entry_id', 'shipping_email_entry_id',
  'control_functions', 'billing_name', 'shipping_name', 'company',
  'created_at', 'updated_at', 'created_by', 'updated_by', 'comments',
  'originated_by', 'import_job_id',
]

function safeJson(field, value, warnings) {
  try {
    return parseJsonField(value)
  } catch (err) {
    warnings.push(`${field}: invalid JSON (${err.message})`)
    return null
  }
}

// rawRow keys are the CSV's own header names (`date`, not `order_date`) —
// the rename to avoid a Postgres reserved-word collision happens here.
function transform(rawRow, importJobId) {
  const warnings = []

  const record = {
    order_id: emptyToNull(rawRow.order_id),
    merchant_id: emptyToNull(rawRow.merchant_id),
    terminal_id: emptyToNull(rawRow.terminal_id),
    reference_id: emptyToNull(rawRow.reference_id),
    currency_code: emptyToNull(rawRow.currency_code),
    meta_data: safeJson('meta_data', rawRow.meta_data, warnings),
    order_date: parseTimestamp(rawRow.date),
    order_status: emptyToNull(rawRow.order_status),
    currency: emptyToNull(rawRow.currency),
    campaign_amount: parseBigIntString(rawRow.campaign_amount),
    shipping_amount: parseBigIntString(rawRow.shipping_amount),
    regular_amount: parseBigIntString(rawRow.regular_amount),
    total_amount: parseBigIntString(rawRow.total_amount),
    customer_id: emptyToNull(rawRow.customer_id),
    billing_address_id: emptyToNull(rawRow.billing_address_id),
    shipping_address_id: emptyToNull(rawRow.shipping_address_id),
    billing_phone_number_id: emptyToNull(rawRow.billing_phone_number_id),
    shipping_phone_number_id: emptyToNull(rawRow.shipping_phone_number_id),
    billing_email_entry_id: emptyToNull(rawRow.billing_email_entry_id),
    shipping_email_entry_id: emptyToNull(rawRow.shipping_email_entry_id),
    control_functions: safeJson('control_functions', rawRow.control_functions, warnings),
    billing_name: emptyToNull(rawRow.billing_name),
    shipping_name: emptyToNull(rawRow.shipping_name),
    company: emptyToNull(rawRow.company),
    created_at: parseTimestamp(rawRow.created_at),
    updated_at: parseTimestamp(rawRow.updated_at),
    created_by: emptyToNull(rawRow.created_by),
    updated_by: emptyToNull(rawRow.updated_by),
    comments: emptyToNull(rawRow.comments),
    originated_by: emptyToNull(rawRow.originated_by),
    import_job_id: importJobId,
  }

  return { record, warnings }
}

module.exports = { transform, COLUMNS, TABLE_NAME }

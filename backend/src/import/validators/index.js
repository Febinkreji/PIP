const orders = require('./orderValidator')
const payments = require('./paymentValidator')
const apiLogs = require('./apiLogValidator')
const terminalEvents = require('./terminalEventValidator')

// Adding a new dataset means adding one validator file and registering it
// here under its dataset-type key.
module.exports = {
  orders,
  payments,
  api_logs: apiLogs,
  terminal_events: terminalEvents,
}

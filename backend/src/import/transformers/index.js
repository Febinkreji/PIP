const orders = require('./orderTransformer')
const payments = require('./paymentTransformer')
const apiLogs = require('./apiLogTransformer')
const terminalEvents = require('./terminalEventTransformer')

// Adding a new dataset means adding one transformer file and registering it
// here under its dataset-type key.
module.exports = {
  orders,
  payments,
  api_logs: apiLogs,
  terminal_events: terminalEvents,
}

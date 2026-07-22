const paymentFailureRule = require('./rules/paymentFailureRule')
const apiFailureRule = require('./rules/apiFailureRule')
const terminalErrorRule = require('./rules/terminalErrorRule')
const missingApiActivityRule = require('./rules/missingApiActivityRule')
const paymentNotCreatedRule = require('./rules/paymentNotCreatedRule')

// Adding a new rule means adding one file under rules/ (id, incidentType,
// evaluate(correlation)) and registering it here — incidentEngine.js never
// branches on rule type, so nothing else changes.
module.exports = [
  paymentFailureRule,
  apiFailureRule,
  terminalErrorRule,
  missingApiActivityRule,
  paymentNotCreatedRule,
]

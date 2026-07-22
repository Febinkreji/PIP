const crypto = require('crypto')
const rules = require('./incidentRules')
const { classifySeverity, classifyConfidence } = require('./incidentClassifier')
const { createNoIncidentResult, createIncidentResult } = require('./incidentModels')

// The Incident Engine consumes ONLY a Correlation Engine result object — it
// never touches the database. Runs every registered rule against it and
// returns one incident object per rule that fired (a correlation can contain
// more than one simultaneous incident, e.g. PAYMENT_FAILURE and API_FAILURE
// together), or a single incidentDetected:false object if none did.
function detectIncidents(correlation) {
  if (!correlation) {
    throw new Error('detectIncidents requires a Correlation Engine result object')
  }

  const fired = []
  for (const rule of rules) {
    const ruleResult = rule.evaluate(correlation)
    if (ruleResult) fired.push(ruleResult)
  }

  if (fired.length === 0) {
    return [createNoIncidentResult({ incidentId: crypto.randomUUID(), correlation })]
  }

  return fired.map((ruleResult) =>
    createIncidentResult({
      incidentId: crypto.randomUUID(),
      correlation,
      ruleResult,
      severity: classifySeverity(ruleResult),
      confidence: classifyConfidence(ruleResult.baseConfidence, correlation),
    })
  )
}

module.exports = { detectIncidents }

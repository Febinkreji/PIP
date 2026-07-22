const { CONFIDENCE_ORDER } = require('./incidentModels')

function downgrade(level, steps) {
  const index = CONFIDENCE_ORDER.indexOf(level)
  const nextIndex = Math.max(0, index - steps)
  return CONFIDENCE_ORDER[nextIndex]
}

// Rule 6 from the spec: correlation QUALITY reduces confidence regardless of
// which detection rule fired — this is a property of the evidence the
// Correlation Engine handed us, not of any individual rule, so it lives here
// rather than being duplicated inside every rule module.
function classifyConfidence(baseConfidence, correlation) {
  let confidence = baseConfidence

  if (correlation.warnings && correlation.warnings.length > 0) {
    confidence = downgrade(confidence, 1)
  }

  if (correlation.inferredMatches && correlation.inferredMatches.length > 0) {
    confidence = downgrade(confidence, 1)
  }

  return confidence
}

// A rule can propose a severityOverride (e.g. terminalErrorRule scales
// severity with error count) — otherwise its declared baseSeverity stands.
function classifySeverity(ruleResult) {
  return ruleResult.severityOverride || ruleResult.baseSeverity
}

module.exports = { classifyConfidence, classifySeverity }

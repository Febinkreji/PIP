const SEVERITY = { INFO: 'INFO', LOW: 'LOW', MEDIUM: 'MEDIUM', HIGH: 'HIGH', CRITICAL: 'CRITICAL' }
const CONFIDENCE = { LOW: 'LOW', MEDIUM: 'MEDIUM', HIGH: 'HIGH' }

// Ordered low -> high so the classifier can step confidence down by rank
// rather than hardcoding a lookup table per transition.
const CONFIDENCE_ORDER = [CONFIDENCE.LOW, CONFIDENCE.MEDIUM, CONFIDENCE.HIGH]

function affectedFields(correlation) {
  return {
    affectedMerchant: correlation.merchant?.merchant_id || null,
    affectedStore: correlation.store?.store_id || null,
    affectedTerminal: correlation.terminal?.terminal_id || null,
    affectedOrder: correlation.order?.order_id || (correlation.orders?.[0]?.order_id ?? null),
    affectedPayment: correlation.payment?.payment_id || (correlation.payments?.[0]?.payment_id ?? null),
  }
}

function createNoIncidentResult({ incidentId, correlation }) {
  return {
    incidentId,
    correlationId: correlation.correlationId,
    incidentDetected: false,
    incidentType: null,
    ruleId: null,
    severity: null,
    confidence: null,
    ...affectedFields(correlation),
    evidence: [],
    warnings: correlation.warnings || [],
    missingEvidence: [],
    timelineReferences: [],
    detectedAt: new Date().toISOString(),
  }
}

function createIncidentResult({ incidentId, correlation, ruleResult, severity, confidence }) {
  return {
    incidentId,
    correlationId: correlation.correlationId,
    incidentDetected: true,
    incidentType: ruleResult.incidentType,
    ruleId: ruleResult.ruleId,
    severity,
    confidence,
    ...affectedFields(correlation),
    evidence: ruleResult.evidence || [],
    warnings: correlation.warnings || [],
    missingEvidence: ruleResult.missingEvidence || [],
    timelineReferences: ruleResult.timelineReferences || [],
    detectedAt: new Date().toISOString(),
  }
}

module.exports = { SEVERITY, CONFIDENCE, CONFIDENCE_ORDER, createNoIncidentResult, createIncidentResult }

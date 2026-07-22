const RULE_ID = 'PAYMENT_FAILURE'
const INCIDENT_TYPE = 'PAYMENT_FAILURE'
const FAILED_STATUS = 'PAYMENT_FAILED' // real enum value observed in the source data

function evaluate(correlation) {
  const payments = correlation.payments?.length ? correlation.payments : correlation.payment ? [correlation.payment] : []
  const failedPayments = payments.filter((p) => p.payment_status === FAILED_STATUS)

  if (failedPayments.length === 0) return null

  return {
    ruleId: RULE_ID,
    incidentType: INCIDENT_TYPE,
    baseSeverity: 'HIGH',
    baseConfidence: 'HIGH',
    evidence: failedPayments.map((p) => ({
      type: 'payment',
      record: p,
      note: `Payment ${p.payment_id} has status ${FAILED_STATUS}`,
    })),
    missingEvidence: [],
    timelineReferences: (correlation.timeline || []).filter((t) =>
      failedPayments.some((p) => p.payment_id === t.identifier)
    ),
  }
}

module.exports = { id: RULE_ID, incidentType: INCIDENT_TYPE, evaluate }

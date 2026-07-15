const db = require('../../../config/firebase/firebase')
const Investigation = require('../models/investigation.model')
const { NotFoundError } = require('../../../shared/errors')
const { COLLECTIONS } = require('../../../shared/constants/collections')
const { nowIso } = require('../../../shared/utils/dateUtils')
const { collectEvidence } = require('../../evidence/services/evidence.service')
const { correlateEvidence } = require('../../correlation/services/correlation.service')
const { generateAnalysis } = require('../../ai/services/ai.service')
const { buildTimeline } = require('../../timeline/services/timeline.service')
const { createRecommendation } = require('../../recommendation/services/recommendation.service')

async function createInvestigation(incident) {
  const now = nowIso()

  const evidence = await collectEvidence({
    service: incident.service,
    severity: incident.severity,
  })

  const correlatedEvidence = correlateEvidence(incident, evidence)
  const aiAnalysis = generateAnalysis(incident, evidence, correlatedEvidence)
  const timeline = buildTimeline(incident)

  await createRecommendation(incident, correlatedEvidence)

  const investigation = new Investigation({
    incidentId: incident.id,
    ...evidence,
    aiAnalysis,
    timeline,
    createdAt: now,
  })

  await db
    .collection(COLLECTIONS.INVESTIGATIONS)
    .doc(incident.id)
    .set({ ...investigation })

  return investigation
}

async function getInvestigationByIncidentId(incidentId) {
  const doc = await db.collection(COLLECTIONS.INVESTIGATIONS).doc(incidentId).get()

  if (!doc.exists) {
    throw new NotFoundError('Investigation not found')
  }

  return doc.data()
}

module.exports = { createInvestigation, getInvestigationByIncidentId }

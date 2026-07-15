const db = require('../../../config/firebase/firebase')
const Recommendation = require('../models/recommendation.model')
const { NotFoundError } = require('../../../shared/errors')
const { COLLECTIONS } = require('../../../shared/constants/collections')
const { nowIso } = require('../../../shared/utils/dateUtils')

const RECOMMENDATIONS_BY_SOURCE = {
  infrastructure: {
    recommendedActions: [
      'Restart or roll back the affected deployment',
      'Investigate recent pod crash logs for the failing containers',
    ],
    risk: 'MEDIUM',
    estimatedRecoveryTime: '10-20 minutes',
    runbookLink: 'https://runbooks.internal/infrastructure/pod-crash-loop',
  },
  database: {
    recommendedActions: [
      'Scale the database connection pool',
      'Review recent slow queries against the affected instance',
    ],
    risk: 'HIGH',
    estimatedRecoveryTime: '20-40 minutes',
    runbookLink: 'https://runbooks.internal/database/connection-pool-exhaustion',
  },
  kafka: {
    recommendedActions: [
      'Restart the affected consumer group',
      'Quarantine malformed messages to a dead-letter topic if rebalancing persists',
    ],
    risk: 'MEDIUM',
    estimatedRecoveryTime: '15-30 minutes',
    runbookLink: 'https://runbooks.internal/kafka/consumer-lag-rebalance',
  },
  redis: {
    recommendedActions: [
      'Scale the Redis cache cluster horizontally',
      'Review key TTL policy to reduce eviction pressure',
    ],
    risk: 'LOW',
    estimatedRecoveryTime: '10-15 minutes',
    runbookLink: 'https://runbooks.internal/redis/cache-eviction-pressure',
  },
  psp: {
    recommendedActions: [
      'Fail over to the secondary payment processor',
      'Notify the PSP partner of elevated error rates',
    ],
    risk: 'HIGH',
    estimatedRecoveryTime: '30-60 minutes',
    runbookLink: 'https://runbooks.internal/psp/failover-procedure',
  },
  grafana: {
    recommendedActions: [
      'Review recent deployments for the affected service',
      'Correlate the error spike with infrastructure and dependency metrics',
    ],
    risk: 'MEDIUM',
    estimatedRecoveryTime: '15-30 minutes',
    runbookLink: 'https://runbooks.internal/general/error-rate-spike',
  },
  loki: {
    recommendedActions: [
      'Review application error logs for a common stack trace',
      'Check recent deployments for the affected service',
    ],
    risk: 'MEDIUM',
    estimatedRecoveryTime: '15-30 minutes',
    runbookLink: 'https://runbooks.internal/general/application-errors',
  },
}

const DEFAULT_RECOMMENDATION = {
  recommendedActions: ['Engineer review required — no automated recommendation available'],
  risk: 'UNKNOWN',
  estimatedRecoveryTime: 'Unknown',
  runbookLink: 'https://runbooks.internal/general/manual-triage',
}

function generateRecommendation(correlatedEvidence) {
  const ranked = [...correlatedEvidence].sort((a, b) => b.confidence - a.confidence)
  const topSource = ranked[0] && ranked[0].source

  return RECOMMENDATIONS_BY_SOURCE[topSource] || DEFAULT_RECOMMENDATION
}

async function createRecommendation(incident, correlatedEvidence) {
  const now = nowIso()
  const generated = generateRecommendation(correlatedEvidence)

  const recommendation = new Recommendation({
    incidentId: incident.id,
    ...generated,
    createdAt: now,
  })

  await db
    .collection(COLLECTIONS.RECOMMENDATIONS)
    .doc(incident.id)
    .set({ ...recommendation })

  return recommendation
}

async function getRecommendationByIncidentId(incidentId) {
  const doc = await db.collection(COLLECTIONS.RECOMMENDATIONS).doc(incidentId).get()

  if (!doc.exists) {
    throw new NotFoundError('Recommendation not found')
  }

  return doc.data()
}

module.exports = { createRecommendation, getRecommendationByIncidentId, generateRecommendation }

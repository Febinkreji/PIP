const db = require('../../../config/firebase/firebase')
const { NotFoundError, ValidationError } = require('../../../shared/errors')
const { COLLECTIONS } = require('../../../shared/constants/collections')
const { STATUSES } = require('../../../shared/constants/incidentEnums')
const { nowIso } = require('../../../shared/utils/dateUtils')
const { invalidateAggregateCache } = require('../../../shared/cache/aggregateCache')
const statisticsService = require('../../statistics/services/statistics.service')

const STAGE_ORDER = STATUSES
const DEFAULT_COMMENTS = {
  TRIAGED: 'Incident triaged',
  INVESTIGATING: 'Investigation started',
  MITIGATING: 'Mitigation in progress',
  MONITORING: 'Monitoring recovery',
  RESOLVED: 'Incident resolved',
  POSTMORTEM: 'Postmortem started',
}

function assertValidTransition(currentStatus, nextStatus) {
  const currentIndex = STAGE_ORDER.indexOf(currentStatus)
  const nextIndex = STAGE_ORDER.indexOf(nextStatus)

  if (nextIndex === -1 || currentIndex === -1 || nextIndex !== currentIndex + 1) {
    throw new ValidationError('Invalid Workflow Transition')
  }
}

async function transitionIncidentStatus(id, { status, comment, owner, team, resolutionSummary }, actor) {
  const incidentRef = db.collection(COLLECTIONS.INCIDENTS).doc(id)

  // The incident update and every precomputed summary document it affects are
  // written in ONE transaction — the same pattern used for incident creation —
  // so dashboardStats/analyticsSummary/serviceMetrics never drift out of sync.
  const result = await db.runTransaction(async (transaction) => {
    const doc = await transaction.get(incidentRef)

    if (!doc.exists) {
      throw new NotFoundError('Incident not found')
    }

    const incident = doc.data()
    assertValidTransition(incident.status, status)

    const statRefs = statisticsService.getTransitionRefs(incident)
    const statSnaps = await statisticsService.readRefs(transaction, statRefs)

    const now = nowIso()
    const historyEntry = {
      stage: status,
      time: now,
      user: actor || 'System',
      comment: comment || DEFAULT_COMMENTS[status] || `Moved to ${status}`,
    }

    const updates = {
      status,
      updatedAt: now,
      currentStageStartedAt: now,
      workflowHistory: [...(incident.workflowHistory || []), historyEntry],
    }

    if (owner !== undefined) updates.owner = owner
    if (team !== undefined) updates.team = team
    if (status === 'RESOLVED') {
      updates.resolvedAt = now
      if (resolutionSummary !== undefined) updates.resolutionSummary = resolutionSummary
    }
    if (status === 'POSTMORTEM') {
      updates.postmortemCompleted = true
    }

    transaction.update(incidentRef, updates)
    statisticsService.applyStatusTransition(transaction, statRefs, statSnaps, incident, incident.status, status)

    return { ...incident, ...updates }
  })

  invalidateAggregateCache()

  return result
}

module.exports = { transitionIncidentStatus, assertValidTransition }

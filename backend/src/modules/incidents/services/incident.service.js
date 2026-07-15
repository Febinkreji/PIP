const db = require('../../../config/firebase/firebase')
const Incident = require('../models/incident.model')
const { NotFoundError } = require('../../../shared/errors')
const { COLLECTIONS } = require('../../../shared/constants/collections')
const { SEVERITIES } = require('../../../shared/constants/incidentEnums')
const { assertRequiredFields } = require('../../../shared/validators/requiredFields')
const { assertValidEnum } = require('../../../shared/validators/enum')
const { nowIso } = require('../../../shared/utils/dateUtils')
const { createInvestigation } = require('../../investigations/services/investigation.service')
const { invalidateAggregateCache } = require('../../../shared/cache/aggregateCache')
const statisticsService = require('../../statistics/services/statistics.service')

const INCIDENT_COUNTER_DOC = 'incidents'
const REQUIRED_FIELDS = ['title', 'description', 'severity', 'affectedService']
const DEFAULT_PAGE_SIZE = 20
const MAX_PAGE_SIZE = 100

async function generateIncidentId() {
  const counterRef = db.collection(COLLECTIONS.COUNTERS).doc(INCIDENT_COUNTER_DOC)

  const nextValue = await db.runTransaction(async (transaction) => {
    const counterSnapshot = await transaction.get(counterRef)
    const currentValue = counterSnapshot.exists ? counterSnapshot.data().value : 0
    const updatedValue = currentValue + 1

    transaction.set(counterRef, { value: updatedValue })

    return updatedValue
  })

  return `INC-${String(nextValue).padStart(6, '0')}`
}

function validateIncidentInput({ title, description, severity, affectedService }) {
  assertRequiredFields({ title, description, severity, affectedService }, REQUIRED_FIELDS)
  assertValidEnum(severity, SEVERITIES, 'severity')
}

async function createIncident(data) {
  validateIncidentInput(data)

  const { title, description, severity, affectedService } = data
  const now = nowIso()
  const id = await generateIncidentId()

  const incident = new Incident({
    id,
    title,
    description,
    severity,
    status: 'OPEN',
    service: affectedService,
    createdAt: now,
    updatedAt: now,
    workflowHistory: [
      { stage: 'OPEN', time: now, user: 'System', comment: 'Incident created' },
    ],
    currentStageStartedAt: now,
    owner: null,
    team: null,
    resolutionSummary: null,
    resolvedAt: null,
    postmortemCompleted: false,
  })

  const incidentRef = db.collection(COLLECTIONS.INCIDENTS).doc(id)
  const plainIncident = { ...incident }

  // The incident document and every precomputed summary document it affects
  // (dashboardStats, analyticsSummary, serviceMetrics, dailyMetrics) are
  // written in ONE transaction, so the summaries can never fall out of sync
  // with the incidents collection — no cron job, no reconciliation pass.
  await db.runTransaction(async (transaction) => {
    const statRefs = statisticsService.getCreateRefs(plainIncident)
    const statSnaps = await statisticsService.readRefs(transaction, statRefs)

    transaction.set(incidentRef, plainIncident)
    statisticsService.applyIncidentCreated(transaction, statRefs, statSnaps, plainIncident)
  })

  invalidateAggregateCache()
  await createInvestigation(incident)

  return incident
}

function encodeCursor(incident) {
  return incident ? incident.createdAt : null
}

async function getIncidentsPage({ pageSize, cursor, direction } = {}) {
  const safePageSize = Math.min(Math.max(Number(pageSize) || DEFAULT_PAGE_SIZE, 1), MAX_PAGE_SIZE)
  const goingBackward = direction === 'previous'

  let query = db.collection(COLLECTIONS.INCIDENTS).orderBy('createdAt', 'desc')

  if (cursor && goingBackward) {
    query = query.endBefore(cursor).limitToLast(safePageSize)
  } else if (cursor) {
    query = query.startAfter(cursor).limit(safePageSize + 1)
  } else {
    query = query.limit(safePageSize + 1)
  }

  const snapshot = await query.get()
  let incidents = snapshot.docs.map((doc) => doc.data())

  // Forward pages over-fetch by one to detect a next page without a second
  // query. Backward pages (endBefore + limitToLast) always came from a real
  // next page, so hasNextPage is trivially true there.
  let hasNextPage = true
  if (!goingBackward) {
    hasNextPage = incidents.length > safePageSize
    if (hasNextPage) incidents = incidents.slice(0, safePageSize)
  }

  return {
    incidents,
    pageSize: safePageSize,
    nextCursor: incidents.length > 0 && hasNextPage ? encodeCursor(incidents[incidents.length - 1]) : null,
    previousCursor: incidents.length > 0 && cursor ? encodeCursor(incidents[0]) : null,
    hasNextPage,
    hasPreviousPage: Boolean(cursor),
  }
}

async function getIncidentById(id) {
  const doc = await db.collection(COLLECTIONS.INCIDENTS).doc(id).get()

  if (!doc.exists) {
    throw new NotFoundError('Incident not found')
  }

  return doc.data()
}

module.exports = { createIncident, getIncidentsPage, getIncidentById }

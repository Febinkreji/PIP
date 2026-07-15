const db = require('../../../config/firebase/firebase')
const { COLLECTIONS } = require('../../../shared/constants/collections')
const { SEVERITIES, STATUSES, TERMINAL_STATUSES } = require('../../../shared/constants/incidentEnums')
const { toDateKey, nowIso } = require('../../../shared/utils/dateUtils')

// Precomputed-summary layer: dashboard/analytics reads must never scan the
// incidents collection. Every incident create or workflow transition updates
// these summary docs incrementally, in the SAME Firestore transaction as the
// incident write itself, so the summaries can never drift out of sync with
// the incidents they describe.
const DASHBOARD_STATS_DOC_ID = 'current'
const ANALYTICS_SUMMARY_DOC_ID = 'current'
const TREND_WINDOW_DAYS = 90

function emptyCountMap(keys) {
  return Object.fromEntries(keys.map((key) => [key, 0]))
}

// Firestore rejects an array whose elements are themselves arrays ("Nested
// arrays are not allowed"), so the 7x24 hour/day matrix is stored as a map
// keyed by day-of-week ('0'-'6'), each value a flat 24-length array — maps
// containing array-valued fields are fine, only array-of-arrays is not.
function emptyHourDayMatrix() {
  return Object.fromEntries(Array.from({ length: 7 }, (_, day) => [String(day), Array(24).fill(0)]))
}

function blankDashboardStats() {
  return { totalIncidents: 0, openIncidents: 0, criticalIncidents: 0, resolvedIncidents: 0 }
}

function blankAnalyticsSummary() {
  return {
    severityDistribution: emptyCountMap(SEVERITIES),
    statusDistribution: emptyCountMap(STATUSES),
    serviceDistribution: {},
    regionDistribution: {},
    merchantDistribution: {},
    // {name: {incidentCount, criticalCount, openCount}} breakdowns, all kept
    // in the SAME analyticsSummary document so OperationalHealth/RegionalHealth/
    // MerchantAnalytics can render per-entity health from the one read instead
    // of a second query per feature.
    serviceHealth: {},
    regionHealth: {},
    countryHealth: {},
    merchantHealth: {},
    hourDayMatrix: emptyHourDayMatrix(),
    dailyTrend: {},
    resolutionStats: { resolvedCount: 0, totalResolutionMs: 0 },
  }
}

function blankServiceMetrics(service) {
  return { service, incidentCount: 0, criticalCount: 0, openCount: 0 }
}

function blankDailyMetrics(dateKey) {
  return { date: dateKey, incidentCount: 0, criticalCount: 0 }
}

function bumpHealth(healthMap, key, { incidentDelta = 0, criticalDelta = 0, openDelta = 0 }) {
  if (!key) return
  const current = healthMap[key] || { incidentCount: 0, criticalCount: 0, openCount: 0 }
  healthMap[key] = {
    incidentCount: Math.max(current.incidentCount + incidentDelta, 0),
    criticalCount: Math.max(current.criticalCount + criticalDelta, 0),
    openCount: Math.max(current.openCount + openDelta, 0),
  }
}

function trimTrend(dailyTrend) {
  const cutoff = Date.now() - TREND_WINDOW_DAYS * 24 * 60 * 60 * 1000
  const trimmed = {}
  Object.entries(dailyTrend).forEach(([date, count]) => {
    if (new Date(date).getTime() >= cutoff) trimmed[date] = count
  })
  return trimmed
}

function dashboardStatsRef() {
  return db.collection(COLLECTIONS.DASHBOARD_STATS).doc(DASHBOARD_STATS_DOC_ID)
}

function analyticsSummaryRef() {
  return db.collection(COLLECTIONS.ANALYTICS_SUMMARY).doc(ANALYTICS_SUMMARY_DOC_ID)
}

function serviceMetricsRef(service) {
  return db.collection(COLLECTIONS.SERVICE_METRICS).doc(service)
}

function dailyMetricsRef(dateKey) {
  return db.collection(COLLECTIONS.DAILY_METRICS).doc(dateKey)
}

// Refs + read/write helpers used inside a caller-owned transaction, so the
// incident document write and the summary updates commit atomically.

function getCreateRefs(incident) {
  return {
    dashboardRef: dashboardStatsRef(),
    analyticsRef: analyticsSummaryRef(),
    serviceRef: serviceMetricsRef(incident.service),
    dailyRef: dailyMetricsRef(toDateKey(incident.createdAt)),
  }
}

function getTransitionRefs(incident) {
  return {
    dashboardRef: dashboardStatsRef(),
    analyticsRef: analyticsSummaryRef(),
    serviceRef: serviceMetricsRef(incident.service),
  }
}

async function readRefs(tx, refs) {
  const keys = Object.keys(refs)
  const snapshots = await Promise.all(keys.map((key) => tx.get(refs[key])))
  return Object.fromEntries(keys.map((key, index) => [key, snapshots[index]]))
}

function applyIncidentCreated(tx, refs, snaps, incident) {
  const dashboard = snaps.dashboardRef.exists ? snaps.dashboardRef.data() : blankDashboardStats()
  const analytics = snaps.analyticsRef.exists
    ? { ...blankAnalyticsSummary(), ...snaps.analyticsRef.data() }
    : blankAnalyticsSummary()
  const service = snaps.serviceRef.exists ? snaps.serviceRef.data() : blankServiceMetrics(incident.service)
  const dateKey = toDateKey(incident.createdAt)
  const daily = snaps.dailyRef.exists ? snaps.dailyRef.data() : blankDailyMetrics(dateKey)

  dashboard.totalIncidents += 1
  dashboard.openIncidents += 1 // every incident starts OPEN, a non-terminal status
  if (incident.severity === 'CRITICAL') dashboard.criticalIncidents += 1

  analytics.severityDistribution[incident.severity] = (analytics.severityDistribution[incident.severity] || 0) + 1
  analytics.statusDistribution[incident.status] = (analytics.statusDistribution[incident.status] || 0) + 1
  analytics.serviceDistribution[incident.service] = (analytics.serviceDistribution[incident.service] || 0) + 1
  if (incident.region) {
    analytics.regionDistribution[incident.region] = (analytics.regionDistribution[incident.region] || 0) + 1
  }
  if (incident.merchant) {
    analytics.merchantDistribution[incident.merchant] = (analytics.merchantDistribution[incident.merchant] || 0) + 1
  }

  const createdDate = new Date(incident.createdAt)
  analytics.hourDayMatrix[String(createdDate.getDay())][createdDate.getHours()] += 1
  analytics.dailyTrend[dateKey] = (analytics.dailyTrend[dateKey] || 0) + 1
  analytics.dailyTrend = trimTrend(analytics.dailyTrend)

  service.service = incident.service
  service.incidentCount += 1
  service.openCount += 1
  if (incident.severity === 'CRITICAL') service.criticalCount += 1

  const isCritical = incident.severity === 'CRITICAL'
  bumpHealth(analytics.serviceHealth, incident.service, { incidentDelta: 1, openDelta: 1, criticalDelta: isCritical ? 1 : 0 })
  bumpHealth(analytics.regionHealth, incident.region, { incidentDelta: 1, openDelta: 1, criticalDelta: isCritical ? 1 : 0 })
  bumpHealth(analytics.countryHealth, incident.country, { incidentDelta: 1, openDelta: 1, criticalDelta: isCritical ? 1 : 0 })
  bumpHealth(analytics.merchantHealth, incident.merchant, { incidentDelta: 1, openDelta: 1, criticalDelta: isCritical ? 1 : 0 })

  daily.date = dateKey
  daily.incidentCount += 1
  if (incident.severity === 'CRITICAL') daily.criticalCount += 1

  const updatedAt = nowIso()
  tx.set(refs.dashboardRef, { ...dashboard, updatedAt })
  tx.set(refs.analyticsRef, { ...analytics, updatedAt })
  tx.set(refs.serviceRef, { ...service, updatedAt })
  tx.set(refs.dailyRef, { ...daily, updatedAt })
}

function applyStatusTransition(tx, refs, snaps, incident, previousStatus, nextStatus) {
  const dashboard = snaps.dashboardRef.exists ? snaps.dashboardRef.data() : blankDashboardStats()
  const analytics = snaps.analyticsRef.exists
    ? { ...blankAnalyticsSummary(), ...snaps.analyticsRef.data() }
    : blankAnalyticsSummary()
  const service = snaps.serviceRef.exists ? snaps.serviceRef.data() : blankServiceMetrics(incident.service)

  const wasTerminal = TERMINAL_STATUSES.includes(previousStatus)
  const isTerminal = TERMINAL_STATUSES.includes(nextStatus)

  if (!wasTerminal && isTerminal) {
    dashboard.openIncidents = Math.max(dashboard.openIncidents - 1, 0)
    dashboard.resolvedIncidents += 1
    service.openCount = Math.max(service.openCount - 1, 0)

    bumpHealth(analytics.serviceHealth, incident.service, { openDelta: -1 })
    bumpHealth(analytics.regionHealth, incident.region, { openDelta: -1 })
    bumpHealth(analytics.countryHealth, incident.country, { openDelta: -1 })
    bumpHealth(analytics.merchantHealth, incident.merchant, { openDelta: -1 })
  }

  analytics.statusDistribution[previousStatus] = Math.max(
    (analytics.statusDistribution[previousStatus] || 0) - 1,
    0
  )
  analytics.statusDistribution[nextStatus] = (analytics.statusDistribution[nextStatus] || 0) + 1

  if (nextStatus === 'RESOLVED') {
    const resolutionMs = Date.now() - new Date(incident.createdAt).getTime()
    analytics.resolutionStats.resolvedCount += 1
    analytics.resolutionStats.totalResolutionMs += resolutionMs
  }

  const updatedAt = nowIso()
  tx.set(refs.dashboardRef, { ...dashboard, updatedAt })
  tx.set(refs.analyticsRef, { ...analytics, updatedAt })
  tx.set(refs.serviceRef, { ...service, updatedAt })
}

// Used ONLY by the explicit admin maintenance endpoint, which is the one
// sanctioned place in this codebase allowed to scan the whole incidents
// collection — to rebuild every summary doc from the current, final state of
// each incident (not a replay of historical transitions).
function computeFromScratch(incidents) {
  const dashboard = blankDashboardStats()
  const analytics = blankAnalyticsSummary()
  const serviceMetricsByService = new Map()
  const dailyMetricsByDate = new Map()

  incidents.forEach((incident) => {
    const isTerminal = TERMINAL_STATUSES.includes(incident.status)

    dashboard.totalIncidents += 1
    if (isTerminal) {
      dashboard.resolvedIncidents += 1
    } else {
      dashboard.openIncidents += 1
    }
    if (incident.severity === 'CRITICAL') dashboard.criticalIncidents += 1

    analytics.severityDistribution[incident.severity] = (analytics.severityDistribution[incident.severity] || 0) + 1
    analytics.statusDistribution[incident.status] = (analytics.statusDistribution[incident.status] || 0) + 1
    analytics.serviceDistribution[incident.service] = (analytics.serviceDistribution[incident.service] || 0) + 1
    if (incident.region) {
      analytics.regionDistribution[incident.region] = (analytics.regionDistribution[incident.region] || 0) + 1
    }
    if (incident.merchant) {
      analytics.merchantDistribution[incident.merchant] = (analytics.merchantDistribution[incident.merchant] || 0) + 1
    }

    const createdDate = new Date(incident.createdAt)
    analytics.hourDayMatrix[String(createdDate.getDay())][createdDate.getHours()] += 1
    const dateKey = toDateKey(incident.createdAt)
    analytics.dailyTrend[dateKey] = (analytics.dailyTrend[dateKey] || 0) + 1

    if (isTerminal && incident.resolvedAt) {
      const resolutionMs = new Date(incident.resolvedAt).getTime() - new Date(incident.createdAt).getTime()
      analytics.resolutionStats.resolvedCount += 1
      analytics.resolutionStats.totalResolutionMs += Math.max(resolutionMs, 0)
    }

    const service = serviceMetricsByService.get(incident.service) || blankServiceMetrics(incident.service)
    service.incidentCount += 1
    if (!isTerminal) service.openCount += 1
    if (incident.severity === 'CRITICAL') service.criticalCount += 1
    serviceMetricsByService.set(incident.service, service)

    const isCritical = incident.severity === 'CRITICAL'
    bumpHealth(analytics.regionHealth, incident.region, {
      incidentDelta: 1,
      openDelta: isTerminal ? 0 : 1,
      criticalDelta: isCritical ? 1 : 0,
    })
    bumpHealth(analytics.countryHealth, incident.country, {
      incidentDelta: 1,
      openDelta: isTerminal ? 0 : 1,
      criticalDelta: isCritical ? 1 : 0,
    })
    bumpHealth(analytics.merchantHealth, incident.merchant, {
      incidentDelta: 1,
      openDelta: isTerminal ? 0 : 1,
      criticalDelta: isCritical ? 1 : 0,
    })

    const daily = dailyMetricsByDate.get(dateKey) || blankDailyMetrics(dateKey)
    daily.incidentCount += 1
    if (incident.severity === 'CRITICAL') daily.criticalCount += 1
    dailyMetricsByDate.set(dateKey, daily)
  })

  analytics.dailyTrend = trimTrend(analytics.dailyTrend)
  serviceMetricsByService.forEach((service, name) => {
    analytics.serviceHealth[name] = {
      incidentCount: service.incidentCount,
      criticalCount: service.criticalCount,
      openCount: service.openCount,
    }
  })

  return { dashboard, analytics, serviceMetricsByService, dailyMetricsByDate }
}

module.exports = {
  getCreateRefs,
  getTransitionRefs,
  readRefs,
  applyIncidentCreated,
  applyStatusTransition,
  computeFromScratch,
  dashboardStatsRef,
  analyticsSummaryRef,
  serviceMetricsRef,
  dailyMetricsRef,
  blankDashboardStats,
  blankAnalyticsSummary,
}

const db = require('../../../config/firebase/firebase')
const { COLLECTIONS } = require('../../../shared/constants/collections')
const { SEVERITIES, STATUSES } = require('../../../shared/constants/incidentEnums')
const { getCached } = require('../../../shared/cache/aggregateCache')

const TOP_SERVICES_LIMIT = 10

function toOrderedArray(map, keys, fieldName) {
  return keys.map((key) => ({ [fieldName]: key, count: map[key] || 0 }))
}

function toSortedArray(map, fieldName) {
  return Object.entries(map || {})
    .map(([key, count]) => ({ [fieldName]: key, count }))
    .sort((a, b) => b.count - a.count)
}

function toDailyCounts(dailyTrend) {
  return Object.entries(dailyTrend || {})
    .map(([date, count]) => ({ date, count }))
    .sort((a, b) => (a.date < b.date ? -1 : 1))
}

function weekStart(dateKey) {
  const date = new Date(`${dateKey}T00:00:00Z`)
  const day = date.getUTCDay()
  const diff = (day + 6) % 7 // days since Monday
  date.setUTCDate(date.getUTCDate() - diff)
  return date.toISOString().slice(0, 10)
}

function groupCounts(dailyCounts, keyFn) {
  const totals = new Map()
  dailyCounts.forEach(({ date, count }) => {
    const key = keyFn(date)
    totals.set(key, (totals.get(key) || 0) + count)
  })
  return Array.from(totals.entries())
    .map(([key, count]) => ({ period: key, count }))
    .sort((a, b) => (a.period < b.period ? -1 : 1))
}

function blankSummary() {
  return {
    severityDistribution: {},
    statusDistribution: {},
    serviceDistribution: {},
    regionDistribution: {},
    merchantDistribution: {},
    serviceHealth: {},
    regionHealth: {},
    countryHealth: {},
    merchantHealth: {},
    // Stored as a map ('0'-'6' -> flat 24-length array) because Firestore
    // rejects array-of-arrays; reconstructed into a real 2D array below.
    hourDayMatrix: Object.fromEntries(Array.from({ length: 7 }, (_, day) => [String(day), Array(24).fill(0)])),
    dailyTrend: {},
    resolutionStats: { resolvedCount: 0, totalResolutionMs: 0 },
  }
}

function toHealthArray(healthMap, fieldName) {
  return Object.entries(healthMap || {}).map(([key, health]) => ({ [fieldName]: key, ...health }))
}

function toMatrix(hourDayMatrixMap) {
  return Array.from({ length: 7 }, (_, day) => hourDayMatrixMap[String(day)] || Array(24).fill(0))
}

async function fetchAnalyticsSummaryDoc() {
  const doc = await db.collection(COLLECTIONS.ANALYTICS_SUMMARY).doc('current').get()
  return doc.exists ? { ...blankSummary(), ...doc.data() } : blankSummary()
}

// Exactly one Firestore document read (cached for 30s) — no collection scan.
// Every derived shape below (weekly/monthly rollups, sorted top-N arrays) is
// computed in memory from that single document, never from another query.
async function getAnalytics() {
  const summary = await getCached('analyticsSummary', fetchAnalyticsSummaryDoc)

  const serviceDistribution = toSortedArray(summary.serviceDistribution, 'service')
  const dailyCounts = toDailyCounts(summary.dailyTrend)
  const { resolvedCount, totalResolutionMs } = summary.resolutionStats || { resolvedCount: 0, totalResolutionMs: 0 }

  return {
    severityDistribution: toOrderedArray(summary.severityDistribution, SEVERITIES, 'severity'),
    statusDistribution: toOrderedArray(summary.statusDistribution, STATUSES, 'status'),
    serviceDistribution,
    topAffectedServices: serviceDistribution.slice(0, TOP_SERVICES_LIMIT),
    regionDistribution: toSortedArray(summary.regionDistribution, 'region'),
    merchantDistribution: toSortedArray(summary.merchantDistribution, 'merchant'),
    serviceHealth: toHealthArray(summary.serviceHealth, 'service'),
    regionHealth: toHealthArray(summary.regionHealth, 'region'),
    countryHealth: toHealthArray(summary.countryHealth, 'country'),
    merchantHealth: toHealthArray(summary.merchantHealth, 'merchant'),
    hourDayMatrix: toMatrix(summary.hourDayMatrix),
    incidentTrend: dailyCounts,
    weeklyCounts: groupCounts(dailyCounts, weekStart),
    monthlyCounts: groupCounts(dailyCounts, (date) => date.slice(0, 7)),
    resolutionStats: {
      resolvedCount,
      avgResolutionMs: resolvedCount > 0 ? Math.round(totalResolutionMs / resolvedCount) : 0,
    },
  }
}

module.exports = { getAnalytics }

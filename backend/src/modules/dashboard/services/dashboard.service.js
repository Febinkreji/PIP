const db = require('../../../config/firebase/firebase')
const { COLLECTIONS } = require('../../../shared/constants/collections')
const { getCached } = require('../../../shared/cache/aggregateCache')

const PLACEHOLDER_METRICS = {
  paymentSuccessRate: 98.6,
  mttr: '32m',
  mttd: '4m',
  healthyServices: { healthy: 14, total: 14 },
}

const BLANK_STATS = { totalIncidents: 0, openIncidents: 0, criticalIncidents: 0, resolvedIncidents: 0 }

async function fetchDashboardStatsDoc() {
  const doc = await db.collection(COLLECTIONS.DASHBOARD_STATS).doc('current').get()
  return doc.exists ? doc.data() : BLANK_STATS
}

// Exactly one Firestore document read (cached for 30s) — no collection scan.
// dashboardStats/current is kept up to date incrementally by StatisticsService
// on every incident create and workflow transition.
async function getDashboardStats() {
  const stats = await getCached('dashboardStats', fetchDashboardStatsDoc)

  return {
    totalIncidents: stats.totalIncidents,
    openIncidents: stats.openIncidents,
    criticalIncidents: stats.criticalIncidents,
    resolvedIncidents: stats.resolvedIncidents,
    ...PLACEHOLDER_METRICS,
  }
}

module.exports = { getDashboardStats }

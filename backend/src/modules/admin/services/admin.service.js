const db = require('../../../config/firebase/firebase')
const { COLLECTIONS } = require('../../../shared/constants/collections')
const { nowIso } = require('../../../shared/utils/dateUtils')
const { invalidateAggregateCache } = require('../../../shared/cache/aggregateCache')
const statisticsService = require('../../statistics/services/statistics.service')

const MAX_WRITES_PER_BATCH = 450

function chunk(array, size) {
  const chunks = []
  for (let i = 0; i < array.length; i += size) {
    chunks.push(array.slice(i, i + size))
  }
  return chunks
}

// The ONE sanctioned place in this codebase allowed to scan the whole
// incidents collection: a deliberate, explicitly-triggered admin operation
// to rebuild dashboardStats/analyticsSummary/serviceMetrics/dailyMetrics from
// the current state of every incident. Needed once after this redesign ships
// (to backfill summaries for incidents that predate it) and available for
// disaster recovery if a summary doc is ever suspected to have drifted.
async function recomputeStatistics() {
  const snapshot = await db.collection(COLLECTIONS.INCIDENTS).get()
  const incidents = snapshot.docs.map((doc) => doc.data())

  const { dashboard, analytics, serviceMetricsByService, dailyMetricsByDate } =
    statisticsService.computeFromScratch(incidents)

  const updatedAt = nowIso()
  const writeOps = [
    { ref: statisticsService.dashboardStatsRef(), data: { ...dashboard, updatedAt } },
    { ref: statisticsService.analyticsSummaryRef(), data: { ...analytics, updatedAt } },
  ]

  serviceMetricsByService.forEach((service, name) => {
    writeOps.push({ ref: statisticsService.serviceMetricsRef(name), data: { ...service, updatedAt } })
  })

  dailyMetricsByDate.forEach((daily, dateKey) => {
    writeOps.push({ ref: statisticsService.dailyMetricsRef(dateKey), data: { ...daily, updatedAt } })
  })

  const batches = chunk(writeOps, MAX_WRITES_PER_BATCH)
  for (const batchOps of batches) {
    const batch = db.batch()
    batchOps.forEach(({ ref, data }) => batch.set(ref, data))
    await batch.commit()
  }

  invalidateAggregateCache()

  return {
    incidentsScanned: incidents.length,
    servicesRebuilt: serviceMetricsByService.size,
    daysRebuilt: dailyMetricsByDate.size,
    updatedAt,
  }
}

module.exports = { recomputeStatistics }

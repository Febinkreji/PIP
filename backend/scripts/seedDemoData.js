// Quota-conscious demo data seeder.
//
// Design goal: produce ~100 realistic, diverse incidents while touching
// Firestore as few times as possible.
//   - ONE read to find the current incident-id counter.
//   - Everything else (evidence, correlation, AI analysis, timeline,
//     recommendations, and the precomputed dashboardStats/analyticsSummary/
//     serviceMetrics/dailyMetrics summaries) is generated and aggregated
//     ENTIRELY IN MEMORY, then written with a small number of batched writes.
//   - No per-incident transactions, no read-after-write, no collection scans.
const db = require('../src/config/firebase/firebase')
const { COLLECTIONS } = require('../src/shared/constants/collections')
const Incident = require('../src/modules/incidents/models/incident.model')
const Investigation = require('../src/modules/investigations/models/investigation.model')
const Recommendation = require('../src/modules/recommendation/models/recommendation.model')
const { collectEvidence } = require('../src/modules/evidence/services/evidence.service')
const { correlateEvidence } = require('../src/modules/correlation/services/correlation.service')
const { buildTimeline } = require('../src/modules/timeline/services/timeline.service')
const { STATUSES, SEVERITIES } = require('../src/shared/constants/incidentEnums')
const statisticsService = require('../src/modules/statistics/services/statistics.service')
const { toDateKey, nowIso } = require('../src/shared/utils/dateUtils')

const TOTAL_INCIDENTS = Number(process.env.SEED_COUNT) || 100
const INCIDENT_COUNTER_DOC = 'incidents'
const MAX_OPS_PER_BATCH = 450

const MERCHANTS = [
  'Brightpath Grocers', 'QuickMart', 'MegaStore', 'Urban Eats', 'Fresh Basket',
  'FuelOne', 'TravelNow', 'HealthPlus', 'City Pharmacy', 'TechWorld',
  'FashionHub', 'Coffee Central', 'Metro Retail', 'FastPay Demo Merchant', 'Super Electronics',
]

const PSPS = [
  'Stripe', 'Adyen', 'Checkout.com', 'Fiserv', 'Worldpay',
  'PayPal', 'Razorpay', 'Cybersource', 'Ingenico', 'Fis Global',
]

const SERVICES = [
  'checkout-api', 'payment-orchestrator', 'issuer-connector', 'acquirer-connector',
  'fraud-detection-service', 'tokenization-service', 'reporting-service', 'settlement-service',
  'notification-service', 'merchant-api', 'auth-service', 'risk-engine',
  'routing-engine', 'database-cluster', 'redis-cache',
]

const ENGINEERS = [
  'Alex Johnson', 'Priya Sharma', 'John Miller', 'Sarah Chen',
  'David Wilson', 'Mohammed Ali', 'Emily Brown',
]

const REGIONS = [
  { region: 'India', countries: ['India'] },
  { region: 'Europe', countries: ['United Kingdom', 'Germany', 'France'] },
  { region: 'North America', countries: ['United States', 'Canada'] },
  { region: 'APAC', countries: ['Singapore', 'Japan', 'Australia'] },
  { region: 'Middle East', countries: ['United Arab Emirates', 'Saudi Arabia'] },
]

// Root-cause bank: drives errorCode, AI analysis narrative, recommendations,
// and team assignment together, so each incident reads as a coherent story
// rather than randomly-combined fields.
const ROOT_CAUSES = [
  { cause: 'PSP outage', errorCode: 'ERR_PSP_UNAVAILABLE', team: 'Payments Team', components: ['Payment Gateway'],
    summary: (s) => `An upstream PSP outage caused elevated payment failures across ${s}.`,
    actions: ['Switch PSP', 'Check infrastructure metrics'] },
  { cause: 'Issuer outage', errorCode: 'ERR_AUTH_FAILED', team: 'Payments Team', components: ['Payment Gateway', 'Issuer Network'],
    summary: (s) => `A card issuer outage led to a spike in authorization declines for ${s}.`,
    actions: ['Switch PSP', 'Drain traffic'] },
  { cause: 'Database saturation', errorCode: 'ERR_DATABASE', team: 'Platform Team', components: ['Database'],
    summary: (s) => `Database saturation on the primary cluster caused cascading timeouts in ${s}.`,
    actions: ['Investigate database locks', 'Scale Kubernetes pods'] },
  { cause: 'Redis latency', errorCode: 'ERR_REDIS', team: 'Platform Team', components: ['Redis'],
    summary: (s) => `Elevated Redis cache latency degraded response times for ${s}.`,
    actions: ['Clear Redis cache', 'Check infrastructure metrics'] },
  { cause: 'Kafka lag', errorCode: 'ERR_KAFKA_TIMEOUT', team: 'SRE Team', components: ['Kafka'],
    summary: (s) => `Kafka consumer lag delayed event processing for ${s}.`,
    actions: ['Restart Kafka consumer', 'Check infrastructure metrics'] },
  { cause: 'High CPU', errorCode: 'ERR_TIMEOUT', team: 'SRE Team', components: ['Infrastructure'],
    summary: (s) => `Sustained high CPU utilization on ${s} hosts caused request queuing and timeouts.`,
    actions: ['Scale Kubernetes pods', 'Check infrastructure metrics'] },
  { cause: 'Memory leak', errorCode: 'ERR_TIMEOUT', team: 'SRE Team', components: ['Infrastructure'],
    summary: (s) => `A memory leak in ${s} led to gradual performance degradation and restarts.`,
    actions: ['Restart deployment', 'Review recent deployment'] },
  { cause: 'Network packet loss', errorCode: 'ERR_NETWORK', team: 'SRE Team', components: ['Infrastructure'],
    summary: (s) => `Intermittent network packet loss between ${s} and its dependencies caused failed requests.`,
    actions: ['Check infrastructure metrics', 'Drain traffic'] },
  { cause: 'Expired certificate', errorCode: 'ERR_TLS_FAILURE', team: 'Platform Team', components: ['Infrastructure'],
    summary: (s) => `An expired TLS certificate on ${s} caused connection failures.`,
    actions: ['Rotate certificates', 'Review recent deployment'] },
  { cause: 'Deployment failure', errorCode: 'ERR_CONN_REFUSED', team: 'Platform Team', components: ['Infrastructure'],
    summary: (s) => `A failed deployment introduced a regression in ${s}.`,
    actions: ['Rollback release', 'Review recent deployment'] },
  { cause: 'Configuration error', errorCode: 'ERR_TOKEN_EXPIRED', team: 'Platform Team', components: ['Auth Service'],
    summary: (s) => `A misconfiguration in ${s} caused tokens to expire prematurely.`,
    actions: ['Review recent deployment', 'Rotate certificates'] },
  { cause: 'DNS issue', errorCode: 'ERR_NETWORK', team: 'SRE Team', components: ['Infrastructure'],
    summary: (s) => `A DNS resolution issue prevented ${s} from reaching a dependent service.`,
    actions: ['Check infrastructure metrics', 'Drain traffic'] },
  { cause: 'Firewall issue', errorCode: 'ERR_CONN_REFUSED', team: 'SRE Team', components: ['Infrastructure'],
    summary: (s) => `An overly restrictive firewall rule blocked traffic to ${s}.`,
    actions: ['Check infrastructure metrics', 'Drain traffic'] },
  { cause: 'Pod crash loop', errorCode: 'ERR_GATEWAY_TIMEOUT', team: 'SRE Team', components: ['Infrastructure'],
    summary: (s) => `${s} pods entered a crash loop after repeated startup failures.`,
    actions: ['Restart deployment', 'Scale Kubernetes pods'] },
  { cause: 'Connection pool exhaustion', errorCode: 'ERR_DATABASE', team: 'Platform Team', components: ['Database'],
    summary: (s) => `Connection pool exhaustion in ${s} caused new requests to queue and time out.`,
    actions: ['Investigate database locks', 'Scale Kubernetes pods'] },
  { cause: 'Rate limiting', errorCode: 'ERR_RATE_LIMITED', team: 'Fraud Team', components: ['Risk Engine'],
    summary: (s) => `Aggressive rate limiting on ${s} rejected a significant portion of legitimate traffic.`,
    actions: ['Drain traffic', 'Switch PSP'] },
  { cause: 'Slow SQL queries', errorCode: 'ERR_DATABASE', team: 'Platform Team', components: ['Database'],
    summary: (s) => `Slow SQL queries against the primary database degraded ${s} response times.`,
    actions: ['Investigate database locks', 'Inspect application logs'] },
]

const CONFIDENCE_FACTOR_POOL = [
  'Metric correlation', 'Log correlation', 'Infrastructure metrics',
  'Upstream dependency correlation', 'Historical incident similarity',
]

const RECOVERY_TIME_BY_SEVERITY = {
  CRITICAL: '15-30 minutes', HIGH: '30-60 minutes', MEDIUM: '1-2 hours', LOW: '2-4 hours',
}
const RISK_BY_SEVERITY = { CRITICAL: 'HIGH', HIGH: 'HIGH', MEDIUM: 'MEDIUM', LOW: 'LOW' }
const CONFIDENCE_RANGE_BY_SEVERITY = {
  CRITICAL: [85, 97], HIGH: [70, 88], MEDIUM: [55, 75], LOW: [35, 60],
}

const WORKFLOW_STAGE_COMMENTS = {
  OPEN: 'Incident created',
  TRIAGED: 'Incident triaged',
  INVESTIGATING: 'Investigation started',
  MITIGATING: 'Mitigation in progress',
  MONITORING: 'Monitoring recovery',
  RESOLVED: 'Incident resolved',
  POSTMORTEM: 'Postmortem started',
}

function pick(list) {
  return list[Math.floor(Math.random() * list.length)]
}

function randomInt(min, max) {
  return Math.floor(Math.random() * (max - min + 1)) + min
}

function hashString(value) {
  let hash = 0
  for (let i = 0; i < value.length; i += 1) hash = (hash * 31 + value.charCodeAt(i)) >>> 0
  return hash
}

function clamp(value, min, max) {
  return Math.min(Math.max(value, min), max)
}

function shuffle(array) {
  const copy = [...array]
  for (let i = copy.length - 1; i > 0; i -= 1) {
    const j = Math.floor(Math.random() * (i + 1))
    ;[copy[i], copy[j]] = [copy[j], copy[i]]
  }
  return copy
}

// Even-ish spread across all 7 stages ("every stage should have multiple
// incidents"), then shuffled so creation order doesn't correlate with stage.
function buildStatusPlan(total) {
  const base = Math.floor(total / STATUSES.length)
  const remainder = total - base * STATUSES.length
  const counts = STATUSES.map((_, index) => base + (index < remainder ? 1 : 0))
  const plan = []
  STATUSES.forEach((status, index) => {
    for (let i = 0; i < counts[index]; i += 1) plan.push(status)
  })
  return shuffle(plan)
}

// Spread creation dates across the last 30 days, weighted so "today",
// "yesterday", "last week", "two weeks ago", and "last month" all appear.
function randomCreatedAtDaysAgo() {
  const bucket = pick(['today', 'today', 'yesterday', 'thisWeek', 'thisWeek', 'lastWeek', 'lastWeek', 'twoWeeksAgo', 'lastMonth', 'lastMonth'])
  switch (bucket) {
    case 'today': return randomInt(0, 0)
    case 'yesterday': return 1
    case 'thisWeek': return randomInt(2, 6)
    case 'lastWeek': return randomInt(7, 13)
    case 'twoWeeksAgo': return randomInt(14, 20)
    default: return randomInt(21, 30)
  }
}

function buildWorkflowHistory(status, createdAtDate, updatedAtDate, owner) {
  const reachedStages = STATUSES.slice(0, STATUSES.indexOf(status) + 1)
  const spanMs = Math.max(updatedAtDate.getTime() - createdAtDate.getTime(), 0)

  return reachedStages.map((stage, index) => {
    const offsetMs = reachedStages.length > 1 ? (spanMs * index) / (reachedStages.length - 1) : 0
    const comment = stage === 'TRIAGED' && owner ? `Assigned to ${owner}` : WORKFLOW_STAGE_COMMENTS[stage]
    return {
      stage,
      time: new Date(createdAtDate.getTime() + offsetMs).toISOString(),
      user: stage === 'OPEN' ? 'System' : owner || 'Seed Script',
      comment,
    }
  })
}

function buildAiAnalysis(incident, rootCause, correlatedEvidence) {
  const [min, max] = CONFIDENCE_RANGE_BY_SEVERITY[incident.severity]
  const jitter = hashString(`${incident.id}-confidence`) % (max - min + 1)
  const confidence = clamp(min + jitter, 1, 99)

  const humanizedService = incident.service
    .split(/[-_\s]+/)
    .map((word) => (word.toLowerCase() === 'api' ? 'API' : word.charAt(0).toUpperCase() + word.slice(1)))
    .join(' ')

  const significant = correlatedEvidence.filter((entry) => entry.confidence >= 40).slice(0, 4)
  const evidenceNarrative = (significant.length > 0 ? significant : correlatedEvidence.slice(0, 2)).map((e) => e.reason)

  const factorCount = 2 + (hashString(`${incident.id}-factors`) % 2)
  const shuffledFactors = shuffle(CONFIDENCE_FACTOR_POOL)

  return {
    confidence,
    likelyRootCause: rootCause.summary(humanizedService),
    summary: `${rootCause.summary(humanizedService)} Reported error code: ${incident.errorCode}.`,
    correlatedEvidence: evidenceNarrative,
    impactedComponents: Array.from(new Set([humanizedService, ...rootCause.components])),
    confidenceFactors: shuffledFactors.slice(0, factorCount),
  }
}

function buildIncident(sequence, statusPlan) {
  const id = `INC-${String(sequence).padStart(6, '0')}`
  const status = statusPlan[sequence % statusPlan.length]
  const severity = pick(SEVERITIES)
  const rootCause = pick(ROOT_CAUSES)
  const service = pick(SERVICES)
  const merchant = pick(MERCHANTS)
  const psp = pick(PSPS)
  const regionEntry = pick(REGIONS)
  const country = pick(regionEntry.countries)
  const errorCode = rootCause.errorCode

  const daysAgo = randomCreatedAtDaysAgo()
  const createdAtDate = new Date(Date.now() - daysAgo * 24 * 60 * 60 * 1000 - randomInt(0, 23) * 60 * 60 * 1000)
  const isTerminal = status === 'RESOLVED' || status === 'POSTMORTEM'
  const isAssigned = STATUSES.indexOf(status) >= STATUSES.indexOf('TRIAGED')
  const owner = isAssigned ? pick(ENGINEERS) : null
  const team = isAssigned ? rootCause.team : null

  const resolutionMinutes = isTerminal ? randomInt(20, 240) : 0
  const updatedAtDate = isTerminal
    ? new Date(createdAtDate.getTime() + resolutionMinutes * 60 * 1000)
    : new Date(createdAtDate.getTime() + randomInt(5, 90) * 60 * 1000)

  const title = `${rootCause.cause} impacting ${service}`
  const description = `${service} reported ${errorCode} for ${merchant} via ${psp} in ${country} (${regionEntry.region}). Suspected cause: ${rootCause.cause.toLowerCase()}.`

  const incident = new Incident({
    id,
    title,
    description,
    severity,
    status,
    service,
    createdAt: createdAtDate.toISOString(),
    updatedAt: updatedAtDate.toISOString(),
    workflowHistory: buildWorkflowHistory(status, createdAtDate, updatedAtDate, owner),
    currentStageStartedAt: updatedAtDate.toISOString(),
    owner,
    team,
    resolutionSummary: isTerminal ? `Resolved via ${rootCause.actions[0].toLowerCase()}. Service restored to normal operation.` : null,
    resolvedAt: isTerminal ? updatedAtDate.toISOString() : null,
    postmortemCompleted: status === 'POSTMORTEM',
  })

  return { ...incident, merchant, psp, region: regionEntry.region, country, errorCode, rootCause: rootCause.cause }
}

async function buildInvestigationAndRecommendation(incidentData) {
  const rootCause = ROOT_CAUSES.find((entry) => entry.cause === incidentData.rootCause)
  const evidence = await collectEvidence({ service: incidentData.service, severity: incidentData.severity })
  const correlatedEvidence = correlateEvidence(incidentData, evidence)
  const aiAnalysis = buildAiAnalysis(incidentData, rootCause, correlatedEvidence)
  const timeline = buildTimeline(incidentData)

  const investigation = new Investigation({
    incidentId: incidentData.id,
    ...evidence,
    aiAnalysis,
    timeline,
    createdAt: incidentData.createdAt,
  })

  const recommendation = new Recommendation({
    incidentId: incidentData.id,
    recommendedActions: rootCause.actions,
    risk: RISK_BY_SEVERITY[incidentData.severity],
    estimatedRecoveryTime: RECOVERY_TIME_BY_SEVERITY[incidentData.severity],
    runbookLink: `https://runbooks.internal/${rootCause.cause.toLowerCase().replace(/\s+/g, '-')}`,
    createdAt: incidentData.createdAt,
  })

  return { investigation, recommendation }
}

function chunk(array, size) {
  const chunks = []
  for (let i = 0; i < array.length; i += size) chunks.push(array.slice(i, i + size))
  return chunks
}

async function commitWriteOps(writeOps) {
  for (const batchOps of chunk(writeOps, MAX_OPS_PER_BATCH)) {
    const batch = db.batch()
    batchOps.forEach(({ ref, data }) => batch.set(ref, data))
    await batch.commit()
  }
}

async function seedDemoData() {
  console.log(`Seeding ${TOTAL_INCIDENTS} demo incidents...`)

  // The ONE read this script performs: find where the incident-id counter
  // currently is, so generated IDs never collide with existing incidents.
  const counterRef = db.collection(COLLECTIONS.COUNTERS).doc(INCIDENT_COUNTER_DOC)
  const counterSnapshot = await counterRef.get()
  const startingValue = counterSnapshot.exists ? counterSnapshot.data().value : 0

  const statusPlan = buildStatusPlan(TOTAL_INCIDENTS)
  const incidents = []
  const writeOps = []

  for (let i = 0; i < TOTAL_INCIDENTS; i += 1) {
    const sequence = startingValue + i + 1
    const incidentData = buildIncident(sequence, statusPlan)
    incidents.push(incidentData)

    // eslint-disable-next-line no-await-in-loop
    const { investigation, recommendation } = await buildInvestigationAndRecommendation(incidentData)

    writeOps.push({ ref: db.collection(COLLECTIONS.INCIDENTS).doc(incidentData.id), data: incidentData })
    writeOps.push({ ref: db.collection(COLLECTIONS.INVESTIGATIONS).doc(incidentData.id), data: { ...investigation } })
    writeOps.push({ ref: db.collection(COLLECTIONS.RECOMMENDATIONS).doc(incidentData.id), data: { ...recommendation } })
  }

  // Precomputed summaries are derived from the in-memory incident list —
  // the exact same pure function the admin recompute endpoint uses — so no
  // extra reads or per-incident transactions are needed to keep them correct.
  const { dashboard, analytics, serviceMetricsByService, dailyMetricsByDate } =
    statisticsService.computeFromScratch(incidents)

  const updatedAt = nowIso()
  writeOps.push({ ref: statisticsService.dashboardStatsRef(), data: { ...dashboard, updatedAt } })
  writeOps.push({ ref: statisticsService.analyticsSummaryRef(), data: { ...analytics, updatedAt } })
  serviceMetricsByService.forEach((service, name) => {
    writeOps.push({ ref: statisticsService.serviceMetricsRef(name), data: { ...service, updatedAt } })
  })
  dailyMetricsByDate.forEach((daily, dateKey) => {
    writeOps.push({ ref: statisticsService.dailyMetricsRef(dateKey), data: { ...daily, updatedAt } })
  })

  writeOps.push({ ref: counterRef, data: { value: startingValue + TOTAL_INCIDENTS } })

  console.log(`Committing ${writeOps.length} writes in ${chunk(writeOps, MAX_OPS_PER_BATCH).length} batch(es)...`)
  await commitWriteOps(writeOps)

  console.log(
    `Done. Seeded ${TOTAL_INCIDENTS} incidents (${incidents[0].id}-${incidents[incidents.length - 1].id}) ` +
      `plus matching investigations, recommendations, and precomputed summaries.\n` +
      `Total Firestore reads used: 1. Total writes: ${writeOps.length}.`
  )
}

seedDemoData()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error('Seeding failed:', error.message || error)
    process.exit(1)
  })

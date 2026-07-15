const db = require('../src/config/firebase/firebase')
const Incident = require('../src/modules/incidents/models/incident.model')
const Investigation = require('../src/modules/investigations/models/investigation.model')
const Recommendation = require('../src/modules/recommendation/models/recommendation.model')
const { collectEvidence } = require('../src/modules/evidence/services/evidence.service')
const { correlateEvidence } = require('../src/modules/correlation/services/correlation.service')
const { generateRecommendation } = require('../src/modules/recommendation/services/recommendation.service')
const { COLLECTIONS } = require('../src/shared/constants/collections')
const { SEVERITIES, STATUSES } = require('../src/shared/constants/incidentEnums')

const WORKFLOW_STAGE_COMMENTS = {
  OPEN: 'Incident created',
  TRIAGED: 'Incident triaged',
  INVESTIGATING: 'Investigation started',
  MITIGATING: 'Mitigation in progress',
  MONITORING: 'Monitoring recovery',
  RESOLVED: 'Incident resolved',
  POSTMORTEM: 'Postmortem started',
}

function buildWorkflowHistory(status, createdAtDate, updatedAtDate) {
  const reachedStages = STATUSES.slice(0, STATUSES.indexOf(status) + 1)
  const spanMs = Math.max(updatedAtDate.getTime() - createdAtDate.getTime(), 0)

  return reachedStages.map((stage, index) => {
    const offsetMs = reachedStages.length > 1 ? (spanMs * index) / (reachedStages.length - 1) : 0
    return {
      stage,
      time: new Date(createdAtDate.getTime() + offsetMs).toISOString(),
      user: stage === 'OPEN' ? 'System' : 'Seed Script',
      comment: WORKFLOW_STAGE_COMMENTS[stage],
    }
  })
}

const TOTAL_INCIDENTS = Number(process.env.SEED_COUNT) || 10000
const INCIDENTS_PER_BATCH = 166 // 166 incidents * 3 docs = 498 writes, under Firestore's 500-op batch limit
const BATCH_CONCURRENCY = 5
const SEED_DAYS_RANGE = 365
const INCIDENT_COUNTER_DOC = 'incidents'

const MERCHANTS = [
  'Aurora Retail', 'Brightpath Grocers', 'Cascade Electronics', 'Driftwood Apparel',
  'Emberly Home Goods', 'Fernwood Books', 'Glimmer Beauty', 'Harborline Foods',
  'Ironclad Hardware', 'Junction Coffee Co.', 'Kestrel Sports', 'Lumen Pharmacy',
  'Meridian Toys', 'Northstar Travel', 'Orchid Florists', 'Pinecrest Furniture',
  'Quartz Jewelry', 'Riverside Deli', 'Solstice Fitness', 'Thistle & Vine Wines',
]

const PSPS = [
  'NovaPay', 'ClearBridge Payments', 'Meridian Gateway', 'Anchor PSP',
  'Vertex Payments', 'Silverline Processing', 'BluePeak Payments', 'Coral Gateway',
]

const COUNTRIES_BY_REGION = {
  'North America': ['United States', 'Canada', 'Mexico'],
  Europe: ['United Kingdom', 'Germany', 'France', 'Netherlands', 'Spain'],
  APAC: ['Australia', 'Japan', 'Singapore', 'India'],
  LATAM: ['Brazil', 'Argentina', 'Chile'],
  MEA: ['United Arab Emirates', 'South Africa', 'Saudi Arabia'],
}
const REGIONS = Object.keys(COUNTRIES_BY_REGION)

const SERVICES = [
  'payment-service', 'checkout-api', 'settlement-service', 'database', 'kafka',
  'redis', 'issuer-connector', 'fraud-detection-service', 'reporting-service',
  'webhook-dispatcher', 'merchant-integration', 'reconciliation-service',
]

const ERROR_CODES = [
  'ERR_TIMEOUT', 'ERR_5XX', 'ERR_CONN_REFUSED', 'ERR_AUTH_FAILED',
  'ERR_RATE_LIMITED', 'ERR_INVALID_RESPONSE', 'ERR_DB_DEADLOCK', 'ERR_QUEUE_FULL',
]

function pick(list) {
  return list[Math.floor(Math.random() * list.length)]
}

function randomDateWithinDays(days) {
  const past = Date.now() - Math.floor(Math.random() * days * 24 * 60 * 60 * 1000)
  return new Date(past)
}

function buildIncidentId(sequence) {
  return `INC-${String(sequence).padStart(6, '0')}`
}

function chunk(array, size) {
  const chunks = []
  for (let i = 0; i < array.length; i += size) {
    chunks.push(array.slice(i, i + size))
  }
  return chunks
}

function buildIncident(sequence) {
  const region = pick(REGIONS)
  const country = pick(COUNTRIES_BY_REGION[region])
  const merchant = pick(MERCHANTS)
  const psp = pick(PSPS)
  const service = pick(SERVICES)
  const errorCode = pick(ERROR_CODES)
  const severity = pick(SEVERITIES)
  const status = pick(STATUSES)

  const createdAtDate = randomDateWithinDays(SEED_DAYS_RANGE)
  const updatedAtDate =
    status === 'OPEN'
      ? createdAtDate
      : new Date(createdAtDate.getTime() + (10 + Math.random() * 50) * 60 * 1000)

  const id = buildIncidentId(sequence)
  const title = `${service} ${errorCode} impacting ${merchant}`
  const description = `${service} reported ${errorCode} while processing payments for ${merchant} via ${psp} in ${country} (${region}).`

  const workflowHistory = buildWorkflowHistory(status, createdAtDate, updatedAtDate)
  const isTerminal = status === 'RESOLVED' || status === 'POSTMORTEM'

  const incident = new Incident({
    id,
    title,
    description,
    severity,
    status,
    service,
    createdAt: createdAtDate.toISOString(),
    updatedAt: updatedAtDate.toISOString(),
    workflowHistory,
    currentStageStartedAt: workflowHistory[workflowHistory.length - 1].time,
    owner: null,
    team: null,
    resolutionSummary: null,
    resolvedAt: isTerminal ? updatedAtDate.toISOString() : null,
    postmortemCompleted: status === 'POSTMORTEM',
  })

  return { ...incident, merchant, psp, region, country, errorCode }
}

async function buildIncidentBatchWriteOps(sequences) {
  const writeOps = []

  for (const sequence of sequences) {
    const incidentData = buildIncident(sequence)

    writeOps.push({
      ref: db.collection(COLLECTIONS.INCIDENTS).doc(incidentData.id),
      data: incidentData,
    })

    const evidence = await collectEvidence({
      service: incidentData.service,
      severity: incidentData.severity,
    })
    const correlatedEvidence = correlateEvidence(incidentData, evidence)

    const investigation = new Investigation({
      incidentId: incidentData.id,
      ...evidence,
      correlatedEvidence,
      createdAt: incidentData.createdAt,
    })
    writeOps.push({
      ref: db.collection(COLLECTIONS.INVESTIGATIONS).doc(incidentData.id),
      data: { ...investigation },
    })

    const generatedRecommendation = generateRecommendation(correlatedEvidence)
    const recommendation = new Recommendation({
      incidentId: incidentData.id,
      ...generatedRecommendation,
      createdAt: incidentData.createdAt,
    })
    writeOps.push({
      ref: db.collection(COLLECTIONS.RECOMMENDATIONS).doc(incidentData.id),
      data: { ...recommendation },
    })
  }

  return writeOps
}

async function commitWriteOps(writeOps) {
  const batch = db.batch()
  writeOps.forEach(({ ref, data }) => batch.set(ref, data))
  await batch.commit()
}

async function seedFirestore() {
  console.log(`Seeding ${TOTAL_INCIDENTS} incidents...`)

  const counterRef = db.collection(COLLECTIONS.COUNTERS).doc(INCIDENT_COUNTER_DOC)
  const counterSnapshot = await counterRef.get()
  const startingValue = counterSnapshot.exists ? counterSnapshot.data().value : 0

  const sequences = Array.from(
    { length: TOTAL_INCIDENTS },
    (_, index) => startingValue + index + 1
  )
  const incidentBatches = chunk(sequences, INCIDENTS_PER_BATCH)
  const batchGroups = chunk(incidentBatches, BATCH_CONCURRENCY)

  let incidentsCommitted = 0

  for (const group of batchGroups) {
    const groupWriteOps = await Promise.all(group.map(buildIncidentBatchWriteOps))
    await Promise.all(groupWriteOps.map(commitWriteOps))

    incidentsCommitted += group.reduce((sum, sequencesInBatch) => sum + sequencesInBatch.length, 0)

    // Checkpoint after every fully-committed group so a crash never redoes completed work.
    await counterRef.set({ value: startingValue + incidentsCommitted })

    console.log(`Checkpoint: ${incidentsCommitted}/${TOTAL_INCIDENTS} incidents committed.`)
  }

  console.log(
    `Done. Seeded ${TOTAL_INCIDENTS} incidents (${buildIncidentId(startingValue + 1)}–${buildIncidentId(
      startingValue + TOTAL_INCIDENTS
    )}), plus matching investigations and recommendations.`
  )
}

seedFirestore()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error('Seeding stopped:', error.message || error)
    console.error(
      'Progress up to the last checkpoint above is safely saved in the counter. ' +
        'Re-run this script (optionally with SEED_COUNT set to however many are still needed) to continue from exactly where it left off — no duplicates, no redone work.'
    )
    process.exit(1)
  })

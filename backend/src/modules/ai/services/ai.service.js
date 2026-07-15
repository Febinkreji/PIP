const COMPONENT_BY_SOURCE = {
  database: 'Database',
  kafka: 'Kafka',
  redis: 'Redis',
  psp: 'Payment Gateway',
  infrastructure: 'Infrastructure',
}

const FACTOR_BY_SOURCE = {
  grafana: 'Metric correlation',
  loki: 'Log correlation',
  database: 'Metric correlation',
  kafka: 'Infrastructure metrics',
  redis: 'Infrastructure metrics',
  infrastructure: 'Infrastructure metrics',
  psp: 'Upstream dependency correlation',
}

const ROOT_CAUSE_TEMPLATES = {
  database: [
    (service) => `Database connection pool exhaustion caused cascading timeout failures in ${service}.`,
    (service) => `A sustained spike in database write latency triggered downstream request failures in ${service}.`,
  ],
  kafka: [
    (service) => `Kafka consumer lag and repeated partition rebalancing delayed event processing for ${service}.`,
    (service) => `A backlog in the Kafka event pipeline caused processing delays across ${service}.`,
  ],
  redis: [
    (service) => `Redis cache eviction pressure increased cache-miss latency for ${service}.`,
    (service) => `Memory exhaustion on the Redis cache tier degraded lookup performance for ${service}.`,
  ],
  psp: [
    (service) => `Upstream PSP instability caused elevated payment authorization failures in ${service}.`,
    (service) => `A surge in PSP gateway error responses disrupted payment processing for ${service}.`,
  ],
  infrastructure: [
    (service) => `Pod crash-looping and resource exhaustion caused service instability in ${service}.`,
    (service) => `Repeated container restarts under CPU pressure destabilized ${service}.`,
  ],
  grafana: [
    (service) => `A sharp rise in error rate and falling success rate caused degraded performance in ${service}.`,
    (service) => `An abrupt drop in success rate combined with rising errors destabilized ${service}.`,
  ],
  loki: [
    (service) => `A surge in application-level exceptions caused request failures in ${service}.`,
    (service) => `Repeated unhandled exceptions in application logs indicate failures within ${service}.`,
  ],
}

function hashString(value) {
  let hash = 0
  for (let i = 0; i < value.length; i += 1) {
    hash = (hash * 31 + value.charCodeAt(i)) >>> 0
  }
  return hash
}

function clamp(value, min, max) {
  return Math.min(Math.max(value, min), max)
}

function humanizeServiceName(service) {
  return service
    .split(/[-_\s]+/)
    .map((word) => (word.toLowerCase() === 'api' ? 'API' : word.charAt(0).toUpperCase() + word.slice(1)))
    .join(' ')
}

function buildImpactedComponents(ranked, humanizedService) {
  const components = new Set([humanizedService])

  ranked
    .filter((entry) => entry.confidence >= 40 && COMPONENT_BY_SOURCE[entry.source])
    .forEach((entry) => components.add(COMPONENT_BY_SOURCE[entry.source]))

  return Array.from(components)
}

function buildConfidenceFactors(ranked) {
  const factors = new Set(['Historical incident similarity'])

  ranked
    .filter((entry) => entry.confidence >= 40)
    .forEach((entry) => {
      const factor = FACTOR_BY_SOURCE[entry.source]
      if (factor) factors.add(factor)
    })

  return Array.from(factors)
}

function generateAnalysis(incident, evidence, correlatedEvidence) {
  const ranked = [...correlatedEvidence].sort((a, b) => b.confidence - a.confidence)
  const top = ranked[0]
  const secondary = ranked[1]
  const humanizedService = humanizeServiceName(incident.service)

  const confidenceJitter = (hashString(`${incident.id}-confidence`) % 7) - 3
  const confidence = clamp(top.confidence + confidenceJitter, 1, 99)

  const templates = ROOT_CAUSE_TEMPLATES[top.source] || ROOT_CAUSE_TEMPLATES.grafana
  const variantIndex = hashString(`${incident.id}-${top.source}`) % templates.length
  const likelyRootCause = templates[variantIndex](humanizedService)

  const errorCodeNote = incident.errorCode
    ? ` This aligns with the reported ${incident.errorCode} error code.`
    : ''
  const secondaryNote = secondary ? ` ${secondary.reason}` : ''
  const summary = `${likelyRootCause}${errorCodeNote}${secondaryNote}`

  const significantEvidence = ranked.filter((entry) => entry.confidence >= 40).slice(0, 5)
  const correlatedEvidenceNarrative = (
    significantEvidence.length > 0 ? significantEvidence : ranked.slice(0, 3)
  ).map((entry) => entry.reason)

  return {
    confidence,
    likelyRootCause,
    summary,
    correlatedEvidence: correlatedEvidenceNarrative,
    impactedComponents: buildImpactedComponents(ranked, humanizedService),
    confidenceFactors: buildConfidenceFactors(ranked),
  }
}

module.exports = { generateAnalysis }

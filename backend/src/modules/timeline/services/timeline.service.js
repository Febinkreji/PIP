const BASE_EVENTS = [
  {
    title: 'Payment Success Rate Dropped',
    description: 'Success rate fell below the SLA threshold.',
  },
  {
    title: 'Alert Triggered',
    description: (severity) => `Grafana generated a ${severity} alert.`,
  },
  {
    title: 'Correlation Engine Started',
    description: 'Collected metrics from all monitoring sources.',
  },
  {
    title: 'Evidence Collected',
    description: 'Logs, metrics, Kafka, Redis and Database evidence gathered.',
  },
  {
    title: 'AI Root Cause Generated',
    description: 'Correlation engine identified the probable root cause.',
  },
  {
    title: 'Recommendation Generated',
    description: 'Suggested recovery actions generated.',
  },
]

const ESCALATION_EVENT = {
  title: 'Escalated to On-Call',
  description: 'PagerDuty notified the on-call engineer due to CRITICAL severity.',
}

const STEP_MINUTES_BY_SEVERITY = {
  CRITICAL: 1,
  HIGH: 2,
  MEDIUM: 3,
  LOW: 4,
}

function hashString(value) {
  let hash = 0
  for (let i = 0; i < value.length; i += 1) {
    hash = (hash * 31 + value.charCodeAt(i)) >>> 0
  }
  return hash
}

function formatClock(hour, minute) {
  const totalMinutes = hour * 60 + minute
  const h = Math.floor(totalMinutes / 60) % 24
  const m = totalMinutes % 60
  return `${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}`
}

function buildTimeline(incident) {
  const events = [...BASE_EVENTS]

  if (incident.severity === 'CRITICAL') {
    events.splice(2, 0, ESCALATION_EVENT)
  }

  const stepMinutes = STEP_MINUTES_BY_SEVERITY[incident.severity] || 3
  const seed = hashString(incident.id)
  const startHour = 8 + (seed % 10)
  const startMinute = seed % 60

  return events.map((event, index) => ({
    time: formatClock(startHour, startMinute + index * stepMinutes),
    title: event.title,
    description:
      typeof event.description === 'function'
        ? event.description(incident.severity)
        : event.description,
  }))
}

module.exports = { buildTimeline }

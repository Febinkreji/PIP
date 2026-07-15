import { useEffect, useState } from 'react'
import { SeverityBadge, StatusBadge } from '../Badge'
import { STAGE_LABELS, derivePriority } from '../../constants/workflow'
import { deriveIncidentCommander, formatRelativeTime, formatDurationFrom } from '../../utils/incidentAnalytics'
import './IncidentHeader.css'

function formatDateTime(iso) {
  return new Date(iso).toLocaleString()
}

// Ticks once a second purely to re-render "elapsed"/"18 seconds ago" text —
// a local clock only, never touches the network or Firestore.
export function IncidentHeader({ incident }) {
  const [, setTick] = useState(0)

  useEffect(() => {
    const interval = setInterval(() => setTick((t) => t + 1), 1000)
    return () => clearInterval(interval)
  }, [])

  const isLive = incident.status !== 'RESOLVED' && incident.status !== 'POSTMORTEM'
  const commander = deriveIncidentCommander(incident)

  const fields = [
    { label: 'Merchant', value: incident.merchant || '—' },
    { label: 'PSP', value: incident.psp || '—' },
    { label: 'Region', value: incident.region || '—' },
    { label: 'Affected Service', value: incident.service },
    { label: 'Assigned Engineer', value: incident.owner || 'Unassigned' },
    { label: 'Incident Commander', value: commander },
    { label: 'Current Stage', value: STAGE_LABELS[incident.status] || incident.status },
    { label: 'Elapsed Time', value: formatDurationFrom(incident.createdAt) },
    { label: 'Created', value: formatDateTime(incident.createdAt) },
    { label: 'Last Updated', value: formatRelativeTime(incident.updatedAt) },
  ]

  return (
    <div className="incident-header">
      <div className="incident-header-top">
        <span className="incident-header-id">{incident.id}</span>
        <SeverityBadge severity={incident.severity} />
        <span className="priority-badge">{derivePriority(incident.severity)}</span>
        <StatusBadge status={incident.status} />
        {isLive && (
          <span className="live-badge">
            <span className="live-badge-dot" />
            LIVE
          </span>
        )}
      </div>

      <h1>{incident.title}</h1>
      <p className="incident-header-description">{incident.description}</p>

      <div className="incident-header-grid">
        {fields.map((field) => (
          <div className="incident-header-field" key={field.label}>
            <span className="meta-label">{field.label}</span>
            <span className="incident-header-value">{field.value}</span>
          </div>
        ))}
      </div>
    </div>
  )
}

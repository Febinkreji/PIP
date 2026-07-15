import { buildActivityTimeline } from '../../utils/incidentAnalytics'
import './ActivityTimeline.css'

function formatDateTime(iso) {
  return new Date(iso).toLocaleString()
}

function formatDuration(ms) {
  if (ms === null || ms === undefined) return null
  const minutes = Math.round(ms / 60000)
  if (minutes < 1) return '<1m'
  if (minutes < 60) return `${minutes}m`
  const hours = Math.floor(minutes / 60)
  return `${hours}h ${minutes % 60}m`
}

// Merges investigation.timeline (pipeline events) and incident.workflowHistory
// (stage transitions) into one chronological feed — both already loaded by
// IncidentDetails, so this costs zero additional reads.
export function ActivityTimeline({ incident, investigation }) {
  const entries = buildActivityTimeline(incident, investigation)

  return (
    <section className="activity-timeline-panel">
      <h2>Incident Activity Timeline</h2>

      {entries.length === 0 ? (
        <p className="activity-timeline-empty">No activity recorded yet.</p>
      ) : (
        <ol className="activity-timeline">
          {entries.map((entry, index) => (
            <li
              className="activity-timeline-step"
              key={entry.key}
              style={{ animationDelay: `${index * 40}ms` }}
            >
              <div className={`activity-timeline-marker activity-timeline-marker-${entry.category.toLowerCase()}`} />
              <div className="activity-timeline-body">
                <div className="activity-timeline-step-header">
                  <span className={`activity-timeline-category activity-timeline-category-${entry.category.toLowerCase()}`}>
                    {entry.category}
                  </span>
                  <span className="activity-timeline-action">{entry.action}</span>
                  <span className="activity-timeline-time">{formatDateTime(entry.time)}</span>
                </div>
                <p className="activity-timeline-description">
                  {entry.description}
                  <span className="activity-timeline-user"> — {entry.user}</span>
                </p>
                {entry.durationMs !== null && (
                  <span className="activity-timeline-duration">+{formatDuration(entry.durationMs)} to next event</span>
                )}
              </div>
            </li>
          ))}
        </ol>
      )}
    </section>
  )
}

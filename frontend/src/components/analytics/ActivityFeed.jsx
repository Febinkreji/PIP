import './ActivityFeed.css'

const PIPELINE_STAGES = [
  { offsetSeconds: 0, icon: '🚨', tone: 'critical', build: (incident) => `${incident.severity} incident created: ${incident.title}` },
  { offsetSeconds: 45, icon: '🔎', tone: 'accent', build: (incident) => `Evidence collected for ${incident.id}` },
  { offsetSeconds: 60, icon: '🤖', tone: 'ai', build: (incident) => `AI root cause generated for ${incident.id}` },
  { offsetSeconds: 75, icon: '✅', tone: 'success', build: (incident) => `Recommendation generated for ${incident.id}` },
]

function buildFeedEntries(incidents) {
  const recentIncidents = [...incidents]
    .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt))
    .slice(0, 8)

  const entries = recentIncidents.flatMap((incident) =>
    PIPELINE_STAGES.map((stage) => {
      const time = new Date(new Date(incident.createdAt).getTime() + stage.offsetSeconds * 1000)
      return {
        key: `${incident.id}-${stage.offsetSeconds}`,
        time,
        icon: stage.icon,
        tone: stage.tone,
        description: stage.build(incident),
      }
    })
  )

  return entries.sort((a, b) => b.time - a.time).slice(0, 24)
}

function formatTime(date) {
  return date.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', hour12: false })
}

export function ActivityFeed({ incidents }) {
  const entries = buildFeedEntries(incidents)

  return (
    <section className="activity-feed">
      <h2 className="analytics-section-title">Live Activity Feed</h2>
      <div className="chart-card activity-feed-card">
        {entries.length === 0 ? (
          <p className="chart-empty">No recent activity.</p>
        ) : (
          <ol className="activity-feed-list">
            {entries.map((entry) => (
              <li className="activity-feed-item" key={entry.key}>
                <span className={`activity-feed-icon activity-feed-icon-${entry.tone}`}>
                  {entry.icon}
                </span>
                <span className="activity-feed-time">{formatTime(entry.time)}</span>
                <span className="activity-feed-description">{entry.description}</span>
              </li>
            ))}
          </ol>
        )}
      </div>
    </section>
  )
}

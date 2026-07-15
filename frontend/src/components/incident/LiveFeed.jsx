import { buildLiveFeedEvents } from '../../utils/incidentAnalytics'
import './LiveFeed.css'

function formatTime(iso) {
  return new Date(iso).toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', hour12: false })
}

const TONE_ICON = { ai: '🤖', engineer: '👤', system: '⚙️' }

// `localEvents` are ephemeral, client-only entries (Escalate / Add Comment)
// from WorkflowActions — never persisted, never fetched. Everything else is
// derived from the incident/investigation documents already loaded.
export function LiveFeed({ incident, investigation, localEvents }) {
  const derived = buildLiveFeedEvents(incident, investigation)
  const all = [...localEvents, ...derived].sort((a, b) => new Date(b.time) - new Date(a.time))

  return (
    <aside className="live-feed">
      <h2>Live Incident Feed</h2>
      {all.length === 0 ? (
        <p className="live-feed-empty">No activity yet.</p>
      ) : (
        <ul className="live-feed-list">
          {all.map((event) => (
            <li className="live-feed-item" key={event.key}>
              <span className={`live-feed-icon live-feed-icon-${event.tone}`}>{TONE_ICON[event.tone] || '•'}</span>
              <div className="live-feed-body">
                <p className="live-feed-text">{event.text}</p>
                <span className="live-feed-time">{formatTime(event.time)}</span>
              </div>
            </li>
          ))}
        </ul>
      )}
    </aside>
  )
}

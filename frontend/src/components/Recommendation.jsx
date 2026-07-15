import { useState } from 'react'
import { useAuth } from '../context/AuthContext'
import { fetchJson } from '../api/client'
import { WORKFLOW_WRITE_ROLES } from '../constants/workflow'
import { RunbookCard } from './incident/RunbookCard'
import './Recommendation.css'

export function Recommendation({ recommendation, incident, onIncidentUpdated }) {
  const { role } = useAuth()
  const [accepting, setAccepting] = useState(false)
  const [error, setError] = useState(null)

  const canAccept =
    incident &&
    onIncidentUpdated &&
    incident.status === 'INVESTIGATING' &&
    WORKFLOW_WRITE_ROLES.includes(role)

  async function handleAccept() {
    setAccepting(true)
    setError(null)

    try {
      const updated = await fetchJson(`/incidents/${incident.id}/status`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          status: 'MITIGATING',
          comment: 'Recommendation accepted',
        }),
      })
      onIncidentUpdated(updated)
    } catch {
      setError('Failed to accept recommendation. Please try again.')
    } finally {
      setAccepting(false)
    }
  }

  return (
    <section className="recommendation-panel">
      <div className="recommendation-header">
        <h2>Recommendations</h2>
        <span className={`recommendation-risk recommendation-risk-${recommendation.risk.toLowerCase()}`}>
          Risk: {recommendation.risk}
        </span>
      </div>

      <div className="recommendation-section">
        <h3>Recommended Actions</h3>
        <ul>
          {recommendation.recommendedActions.map((item) => (
            <li key={item}>{item}</li>
          ))}
        </ul>
      </div>

      <div className="recommendation-meta">
        <div>
          <span className="meta-label">Estimated Recovery Time</span>
          {recommendation.estimatedRecoveryTime}
        </div>
      </div>

      <p className="recommendation-disclaimer">
        Recommendations are advisory only and require engineer approval before action.
      </p>

      {canAccept && (
        <div className="recommendation-accept">
          {error && <p className="recommendation-accept-error">{error}</p>}
          <button
            type="button"
            className="recommendation-accept-button"
            onClick={handleAccept}
            disabled={accepting}
          >
            {accepting ? 'Accepting…' : 'Accept Recommendation → Move to Mitigating'}
          </button>
        </div>
      )}

      <div className="recommendation-runbook">
        <RunbookCard runbookLink={recommendation.runbookLink} />
      </div>
    </section>
  )
}

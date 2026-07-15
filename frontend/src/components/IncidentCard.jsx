import { useNavigate } from 'react-router-dom'
import { SeverityBadge, StatusBadge } from './Badge'
import { WORKFLOW_STAGES, getStageIndex, formatElapsed } from '../constants/workflow'
import './IncidentCard.css'

function formatDateTime(isoString) {
  return new Date(isoString).toLocaleString()
}

function MiniWorkflowProgress({ status }) {
  const currentIndex = getStageIndex(status)

  return (
    <div className="incident-card-progress" title={`Stage ${currentIndex + 1} of ${WORKFLOW_STAGES.length}`}>
      {WORKFLOW_STAGES.map((stage, index) => (
        <span
          key={stage}
          className={`incident-card-progress-segment ${
            index < currentIndex
              ? 'incident-card-progress-completed'
              : index === currentIndex
                ? 'incident-card-progress-current'
                : ''
          }`}
        />
      ))}
    </div>
  )
}

export function IncidentCard({ incident }) {
  const navigate = useNavigate()

  return (
    <div className="incident-card">
      <div className="incident-card-header">
        <span className="incident-card-id">{incident.id}</span>
        <SeverityBadge severity={incident.severity} />
      </div>
      <h3 className="incident-card-title">{incident.title}</h3>
      <p className="incident-card-summary">{incident.description}</p>

      <MiniWorkflowProgress status={incident.status} />

      <div className="incident-card-footer">
        <StatusBadge status={incident.status} />
        <span className="incident-card-service">{incident.service}</span>
        <span className="incident-card-time">{formatDateTime(incident.createdAt)}</span>
      </div>
      <div className="incident-card-footer">
        <span className="incident-card-owner">{incident.owner || 'Unassigned'}</span>
        <span className="incident-card-elapsed">Elapsed: {formatElapsed(incident.createdAt)}</span>
      </div>
      <button
        type="button"
        className="incident-card-investigate"
        onClick={() => navigate(`/incidents/${incident.id}`)}
      >
        Investigate →
      </button>
    </div>
  )
}

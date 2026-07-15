import { useState } from 'react'
import { useAuth } from '../context/AuthContext'
import { fetchJson } from '../api/client'
import { WORKFLOW_WRITE_ROLES, getStageIndex, STAGE_LABELS } from '../constants/workflow'
import { deriveIncidentCommander, deriveEscalation } from '../utils/incidentAnalytics'
import './WorkflowActions.css'

function formatMinutes(minutes) {
  const abs = Math.abs(minutes)
  if (abs < 60) return `${abs}m`
  const hours = Math.floor(abs / 60)
  return `${hours}h ${abs % 60}m`
}

const ACTIONS = [
  { stage: 'TRIAGED', label: 'Move to Triaged' },
  { stage: 'INVESTIGATING', label: 'Move to Investigating' },
  { stage: 'MITIGATING', label: 'Move to Mitigating' },
  { stage: 'MONITORING', label: 'Move to Monitoring' },
  { stage: 'RESOLVED', label: 'Resolve Incident' },
  { stage: 'POSTMORTEM', label: 'Create Postmortem' },
]

// onLocalActivity is an OPTIONAL callback used only to append client-side,
// non-persisted notes (Escalate / Add Comment) to the on-page live feed —
// there is no backend endpoint for free-form comments, so these are UI-only
// conveniences and never touch Firestore.
export function WorkflowActions({ incident, onUpdated, onLocalActivity }) {
  const { role } = useAuth()
  const [owner, setOwner] = useState(incident.owner || '')
  const [team, setTeam] = useState(incident.team || '')
  const [comment, setComment] = useState('')
  const [resolutionSummary, setResolutionSummary] = useState(incident.resolutionSummary || '')
  const [pendingStage, setPendingStage] = useState(null)
  const [error, setError] = useState(null)
  const [noteDraft, setNoteDraft] = useState('')

  const currentIndex = getStageIndex(incident.status)
  const canWrite = WORKFLOW_WRITE_ROLES.includes(role)
  const commander = deriveIncidentCommander(incident)
  const escalation = deriveEscalation(incident)
  const nextStage = getStageIndex(incident.status) + 1 <= 6 ? ACTIONS.find((a) => getStageIndex(a.stage) === currentIndex + 1) : null

  async function handleTransition(stage) {
    setError(null)
    setPendingStage(stage)

    try {
      const body = { status: stage }
      if (owner.trim()) body.owner = owner.trim()
      if (team.trim()) body.team = team.trim()
      if (comment.trim()) body.comment = comment.trim()
      if (stage === 'RESOLVED' && resolutionSummary.trim()) {
        body.resolutionSummary = resolutionSummary.trim()
      }

      const updated = await fetchJson(`/incidents/${incident.id}/status`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      })

      setComment('')
      onUpdated(updated)
      onLocalActivity?.(`Workflow advanced to ${STAGE_LABELS[stage] || stage}`)
    } catch {
      setError('Failed to update workflow status. Please try again.')
    } finally {
      setPendingStage(null)
    }
  }

  function handleEscalate() {
    onLocalActivity?.(`Incident escalated to ${escalation.level} by ${role || 'current user'}`)
  }

  function handleAddComment() {
    if (!noteDraft.trim()) return
    onLocalActivity?.(`Comment added: "${noteDraft.trim()}"`)
    setNoteDraft('')
  }

  return (
    <aside className="workflow-actions">
      <h2>Workflow Actions</h2>

      {!canWrite && (
        <p className="workflow-actions-readonly">
          Your role does not have permission to change incident status.
        </p>
      )}

      <div className="workflow-actions-summary">
        <div className="workflow-actions-summary-row">
          <span className="meta-label">Incident Commander</span>
          <span>{commander}</span>
        </div>
        <div className="workflow-actions-summary-row">
          <span className="meta-label">Primary Team</span>
          <span>{incident.team || 'Unassigned'}</span>
        </div>
        <div className="workflow-actions-summary-row">
          <span className="meta-label">Escalation Level</span>
          <span>{escalation.level}</span>
        </div>
        <div className="workflow-actions-summary-row">
          <span className="meta-label">SLA Target</span>
          <span>{escalation.slaTargetMinutes} minutes</span>
        </div>
        <div className="workflow-actions-summary-row">
          <span className="meta-label">Time Remaining</span>
          <span className={escalation.isBreached ? 'workflow-actions-breached' : ''}>
            {escalation.isBreached
              ? `Breached by ${formatMinutes(escalation.timeRemainingMinutes)}`
              : formatMinutes(escalation.timeRemainingMinutes)}
          </span>
        </div>
        <div className="workflow-actions-summary-row">
          <span className="meta-label">Next Workflow Step</span>
          <span>{nextStage ? STAGE_LABELS[nextStage.stage] : 'None — final stage'}</span>
        </div>
        <div className="workflow-actions-summary-row">
          <span className="meta-label">Approval Status</span>
          <span>{escalation.approvalStatus}</span>
        </div>
      </div>

      <div className="workflow-actions-field">
        <label htmlFor="workflow-owner">Assigned Engineer</label>
        <input
          id="workflow-owner"
          type="text"
          value={owner}
          onChange={(e) => setOwner(e.target.value)}
          placeholder="e.g. Jane Doe"
          disabled={!canWrite}
        />
      </div>

      <div className="workflow-actions-field">
        <label htmlFor="workflow-team">Team</label>
        <input
          id="workflow-team"
          type="text"
          value={team}
          onChange={(e) => setTeam(e.target.value)}
          placeholder="e.g. Payments Team"
          disabled={!canWrite}
        />
      </div>

      <div className="workflow-actions-field">
        <label htmlFor="workflow-comment">Transition Comment (optional)</label>
        <textarea
          id="workflow-comment"
          value={comment}
          onChange={(e) => setComment(e.target.value)}
          placeholder="Add a note for this transition"
          rows={2}
          disabled={!canWrite}
        />
      </div>

      {currentIndex === getStageIndex('MONITORING') && (
        <div className="workflow-actions-field">
          <label htmlFor="workflow-resolution">Resolution Summary</label>
          <textarea
            id="workflow-resolution"
            value={resolutionSummary}
            onChange={(e) => setResolutionSummary(e.target.value)}
            placeholder="Summarize the resolution before resolving"
            rows={2}
            disabled={!canWrite}
          />
        </div>
      )}

      {error && <p className="workflow-actions-error">{error}</p>}

      <div className="workflow-actions-buttons">
        {ACTIONS.map((action) => {
          const stageIndex = getStageIndex(action.stage)
          const isValidNext = canWrite && stageIndex === currentIndex + 1
          const isPending = pendingStage === action.stage

          return (
            <button
              key={action.stage}
              type="button"
              className={`workflow-actions-button ${
                action.stage === 'RESOLVED' || action.stage === 'POSTMORTEM' ? 'workflow-actions-button-primary' : ''
              }`}
              disabled={!isValidNext || pendingStage !== null}
              onClick={() => handleTransition(action.stage)}
            >
              {isPending ? 'Updating…' : action.label}
            </button>
          )
        })}
      </div>

      <div className="workflow-actions-secondary">
        <button type="button" className="workflow-actions-secondary-button" onClick={handleEscalate} disabled={!canWrite}>
          Escalate
        </button>
        <div className="workflow-actions-note-field">
          <input
            type="text"
            value={noteDraft}
            onChange={(e) => setNoteDraft(e.target.value)}
            placeholder="Add a comment…"
            disabled={!canWrite}
          />
          <button type="button" onClick={handleAddComment} disabled={!canWrite || !noteDraft.trim()}>
            Add Comment
          </button>
        </div>
      </div>
    </aside>
  )
}

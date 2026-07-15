import { useEffect, useState } from 'react'
import { WORKFLOW_STAGES, STAGE_LABELS, STAGE_ICONS, getStageIndex } from '../constants/workflow'
import { computeOverallProgress, formatDurationFrom } from '../utils/incidentAnalytics'
import './WorkflowProgress.css'

function formatDateTime(isoString) {
  return new Date(isoString).toLocaleString()
}

function formatStageTime(isoString) {
  return new Date(isoString).toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', hour12: false })
}

function findHistoryEntry(workflowHistory, stage) {
  return (workflowHistory || []).find((entry) => entry.stage === stage) || null
}

// Ticks once a minute purely to keep "current stage duration" fresh — a local
// clock only, no network activity.
export function WorkflowProgress({ status, workflowHistory, currentStageStartedAt }) {
  const [selectedStage, setSelectedStage] = useState(null)
  const [, setTick] = useState(0)
  const currentIndex = getStageIndex(status)

  useEffect(() => {
    const interval = setInterval(() => setTick((t) => t + 1), 60000)
    return () => clearInterval(interval)
  }, [])

  const selectedEntry = selectedStage ? findHistoryEntry(workflowHistory, selectedStage) : null
  const overallProgress = computeOverallProgress(status)

  return (
    <div className="workflow-progress">
      <div className="workflow-progress-summary">
        <div className="workflow-progress-summary-item">
          <span className="meta-label">Current Stage Duration</span>
          <span className="workflow-progress-summary-value">
            {STAGE_LABELS[status] || status} for {formatDurationFrom(currentStageStartedAt)}
          </span>
        </div>
        <div className="workflow-progress-summary-item workflow-progress-summary-item-right">
          <span className="meta-label">Overall Progress</span>
          <span className="workflow-progress-summary-value">{overallProgress}% Complete</span>
        </div>
      </div>

      <div className="workflow-progress-bar-track">
        <div className="workflow-progress-bar-fill" style={{ width: `${overallProgress}%` }} />
      </div>

      <div className="workflow-progress-track">
        {WORKFLOW_STAGES.map((stage, index) => {
          const entry = findHistoryEntry(workflowHistory, stage)
          const state = index < currentIndex ? 'completed' : index === currentIndex ? 'current' : 'future'

          return (
            <div className="workflow-progress-step" key={stage}>
              {index > 0 && (
                <div
                  className={`workflow-progress-connector ${
                    index <= currentIndex ? 'workflow-progress-connector-filled' : ''
                  }`}
                />
              )}
              <button
                type="button"
                className={`workflow-progress-node workflow-progress-node-${state}`}
                title={entry ? `${STAGE_LABELS[stage]} — ${formatDateTime(entry.time)}` : `${STAGE_LABELS[stage]} — not yet reached`}
                onClick={() => setSelectedStage(stage === selectedStage ? null : stage)}
              >
                <span className="workflow-progress-icon">{STAGE_ICONS[stage]}</span>
                {state === 'current' && <span className="workflow-progress-pulse" />}
              </button>
              <span className={`workflow-progress-label workflow-progress-label-${state}`}>
                {STAGE_LABELS[stage]}
              </span>
              <span className="workflow-progress-time">
                {entry ? formatStageTime(entry.time) : 'Pending'}
              </span>
            </div>
          )
        })}
      </div>

      {selectedStage && (
        <div className="workflow-progress-notes">
          <span className="workflow-progress-notes-stage">{STAGE_LABELS[selectedStage]}</span>
          {selectedEntry ? (
            <>
              <span className="workflow-progress-notes-time">{formatDateTime(selectedEntry.time)}</span>
              <span className="workflow-progress-notes-comment">
                {selectedEntry.comment} — {selectedEntry.user}
              </span>
            </>
          ) : (
            <span className="workflow-progress-notes-comment">This stage has not been reached yet.</span>
          )}
        </div>
      )}
    </div>
  )
}

import { useEffect, useState } from 'react'
import { Link, useParams } from 'react-router-dom'
import { IncidentHeader } from '../components/incident/IncidentHeader'
import { AISummaryCard } from '../components/incident/AISummaryCard'
import { CorrelationGraph } from '../components/incident/CorrelationGraph'
import { EvidenceWorkspace } from '../components/incident/EvidenceWorkspace'
import { ImpactPanel } from '../components/incident/ImpactPanel'
import { ActivityTimeline } from '../components/incident/ActivityTimeline'
import { LiveFeed } from '../components/incident/LiveFeed'
import { RelatedIncidents } from '../components/incident/RelatedIncidents'
import { Recommendation } from '../components/Recommendation'
import { WorkflowProgress } from '../components/WorkflowProgress'
import { WorkflowActions } from '../components/WorkflowActions'
import { fetchJsonOrNull } from '../api/client'
import './IncidentDetails.css'

// IncidentDetails performs exactly 3 Firestore-backed reads (incident,
// investigation, recommendation) on mount — unchanged from before this
// redesign. Every new section below is a pure, in-memory derivation over
// this same data (see src/utils/incidentAnalytics.js); nothing added here
// fetches anything further.
export function IncidentDetails() {
  const { id } = useParams()
  const [incident, setIncident] = useState(null)
  const [investigation, setInvestigation] = useState(null)
  const [recommendation, setRecommendation] = useState(null)
  const [status, setStatus] = useState('loading')
  const [localActivity, setLocalActivity] = useState([])

  useEffect(() => {
    let isMounted = true
    setStatus('loading')

    Promise.all([
      fetchJsonOrNull(`/incidents/${id}`),
      fetchJsonOrNull(`/investigations/${id}`),
      fetchJsonOrNull(`/recommendations/${id}`),
    ])
      .then(([incidentData, investigationData, recommendationData]) => {
        if (!isMounted) return

        if (!incidentData) {
          setStatus('not-found')
          return
        }

        setIncident(incidentData)
        setInvestigation(investigationData)
        setRecommendation(recommendationData)
        setLocalActivity([])
        setStatus('success')
      })
      .catch(() => {
        if (isMounted) setStatus('error')
      })

    return () => {
      isMounted = false
    }
  }, [id])

  function pushLocalActivity(text) {
    setLocalActivity((prev) => [{ key: `local-${Date.now()}-${prev.length}`, time: new Date().toISOString(), text, tone: 'engineer' }, ...prev])
  }

  if (status === 'loading') {
    return (
      <div className="incident-details">
        <Link className="back-link" to="/">
          ← Back to Dashboard
        </Link>
        <div className="incident-skeleton">
          <div className="skeleton-block skeleton-header" />
          <div className="skeleton-block skeleton-bar" />
          <div className="skeleton-grid">
            <div className="skeleton-block skeleton-card" />
            <div className="skeleton-block skeleton-card" />
          </div>
        </div>
      </div>
    )
  }

  if (status === 'not-found' || status === 'error') {
    return (
      <div className="incident-details">
        <Link className="back-link" to="/">
          ← Back to Dashboard
        </Link>
        <p className="info-panel">
          {status === 'not-found'
            ? 'Incident not found.'
            : 'Unable to load incident. Is the backend running?'}
        </p>
      </div>
    )
  }

  return (
    <div className="incident-details">
      <Link className="back-link" to="/">
        ← Back to Dashboard
      </Link>

      <IncidentHeader incident={incident} />

      <div className="workflow-progress-section">
        <WorkflowProgress
          status={incident.status}
          workflowHistory={incident.workflowHistory}
          currentStageStartedAt={incident.currentStageStartedAt || incident.updatedAt}
        />
      </div>

      <div className="incident-layout">
        <div className="incident-body">
          {investigation?.aiAnalysis ? (
            <AISummaryCard analysis={investigation.aiAnalysis} incident={incident} recommendation={recommendation} />
          ) : (
            <p className="info-panel">AI root cause analysis is not yet available for this incident.</p>
          )}

          <CorrelationGraph incident={incident} investigation={investigation} />

          <ImpactPanel incident={incident} />

          {investigation ? (
            <EvidenceWorkspace incident={incident} investigation={investigation} />
          ) : (
            <p className="info-panel">Investigation data is not available for this incident.</p>
          )}

          {recommendation ? (
            <Recommendation
              recommendation={recommendation}
              incident={incident}
              onIncidentUpdated={setIncident}
            />
          ) : (
            <p className="info-panel">Recommendations are not yet available for this incident.</p>
          )}

          <ActivityTimeline incident={incident} investigation={investigation} />

          <RelatedIncidents incident={incident} />
        </div>

        <div className="incident-rail">
          <WorkflowActions incident={incident} onUpdated={setIncident} onLocalActivity={pushLocalActivity} />
          <LiveFeed incident={incident} investigation={investigation} localEvents={localActivity} />
        </div>
      </div>
    </div>
  )
}

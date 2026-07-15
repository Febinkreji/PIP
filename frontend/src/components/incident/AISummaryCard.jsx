import { deriveRiskLevel, deriveRecoveryConfidence, deriveBusinessImpact, deriveNextAction } from '../../utils/incidentAnalytics'
import '../RootCauseAnalysis.css'
import './AISummaryCard.css'

const RISK_TONE = { HIGH: 'critical', MEDIUM: 'medium', LOW: 'low' }

// Every value here is derived in memory from the investigation document
// already fetched by IncidentDetails (aiAnalysis) plus the incident and
// recommendation documents — no extra Firestore reads.
export function AISummaryCard({ analysis, incident, recommendation }) {
  const riskLevel = deriveRiskLevel(incident.severity)
  const recoveryConfidence = deriveRecoveryConfidence(analysis.confidence, incident.status)
  const businessImpact = deriveBusinessImpact(incident)
  const nextAction = deriveNextAction(recommendation, incident)
  const eta = recommendation?.estimatedRecoveryTime || 'Unknown'

  return (
    <section className="rca-panel ai-summary-card">
      <div className="rca-header">
        <h2>AI Incident Summary</h2>
        <span className="rca-confidence-badge">{analysis.confidence}% AI Confidence</span>
      </div>

      <div className="rca-confidence-bar-track">
        <div className="rca-confidence-bar-fill" style={{ width: `${analysis.confidence}%` }} />
      </div>

      <div className="rca-root-cause-card">
        <h3>Likely Root Cause</h3>
        <p>{analysis.likelyRootCause}</p>
      </div>

      <div className="rca-section">
        <h3>Executive Summary</h3>
        <p>{analysis.summary}</p>
      </div>

      <div className="ai-summary-kpi-row">
        <div className="ai-summary-kpi">
          <span className="meta-label">Business Impact</span>
          <span className="ai-summary-kpi-text">{businessImpact}</span>
        </div>
        <div className={`ai-summary-kpi ai-summary-kpi-${RISK_TONE[riskLevel]}`}>
          <span className="meta-label">Risk Level</span>
          <span className="ai-summary-kpi-value">{riskLevel}</span>
        </div>
        <div className="ai-summary-kpi">
          <span className="meta-label">Est. Time To Recover</span>
          <span className="ai-summary-kpi-value">{eta}</span>
        </div>
        <div className="ai-summary-kpi">
          <span className="meta-label">Recovery Confidence</span>
          <span className="ai-summary-kpi-value">{recoveryConfidence}%</span>
        </div>
      </div>

      <div className="rca-section">
        <h3>Affected Components</h3>
        <div className="rca-chip-row">
          {analysis.impactedComponents.map((item) => (
            <span className="rca-chip rca-chip-component" key={item}>
              {item}
            </span>
          ))}
        </div>
      </div>

      <div className="rca-section">
        <h3>Confidence Factors</h3>
        <div className="rca-chip-row">
          {analysis.confidenceFactors.map((item) => (
            <span className="rca-chip rca-chip-factor" key={item}>
              {item}
            </span>
          ))}
        </div>
      </div>

      <div className="ai-summary-next-action">
        <span className="meta-label">Next Recommended Action</span>
        <span className="ai-summary-next-action-text">{nextAction}</span>
      </div>
    </section>
  )
}

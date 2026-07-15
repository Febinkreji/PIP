import { useState } from 'react'
import { EVIDENCE_CATEGORIES, synthesizeEvidence, realLineText, derivePinnedAnomalies } from '../../utils/incidentAnalytics'
import './EvidenceWorkspace.css'

const TREND_ICON = { increasing: '▲', degrading: '▲', stable: '▬' }

function Sparkline({ data }) {
  const width = 84
  const height = 26
  const max = Math.max(...data, 1)
  const min = Math.min(...data, 0)
  const range = max - min || 1
  const points = data
    .map((value, index) => {
      const x = (index / (data.length - 1)) * width
      const y = height - ((value - min) / range) * height
      return `${x.toFixed(1)},${y.toFixed(1)}`
    })
    .join(' ')

  return (
    <svg width={width} height={height} viewBox={`0 0 ${width} ${height}`} className="evidence-sparkline">
      <polyline points={points} fill="none" strokeWidth="1.5" />
    </svg>
  )
}

function EvidenceCard({ panel }) {
  const [expanded, setExpanded] = useState(false)

  return (
    <div className={`evidence-card evidence-card-${panel.status}`}>
      <div className="evidence-card-header">
        <span className={`evidence-card-dot evidence-card-dot-${panel.status}`} />
        <span className="evidence-card-label">{panel.label}</span>
        <Sparkline data={panel.sparkline} />
      </div>

      <div className="evidence-card-value-row">
        <span className="evidence-card-value">{panel.currentValue}</span>
        <span className={`evidence-card-trend evidence-card-trend-${panel.trend}`}>
          {TREND_ICON[panel.trend]} {panel.trend}
        </span>
      </div>

      <div className="evidence-card-meta-row">
        <span>Normal: {panel.normalRange}</span>
        <span className={`evidence-card-contribution evidence-card-contribution-${panel.contribution.toLowerCase()}`}>
          Contribution: {panel.contribution}
        </span>
      </div>

      <div className={`evidence-card-rcl evidence-card-rcl-${panel.rootCauseLikelihood.toLowerCase().replace(/\s+/g, '-')}`}>
        Root Cause Likelihood: {panel.rootCauseLikelihood}
      </div>

      <button type="button" className="evidence-card-toggle" onClick={() => setExpanded((v) => !v)}>
        {expanded ? 'Hide details ▲' : 'Show details ▼'}
      </button>

      {expanded && (
        <div className="evidence-card-details">
          <p className="evidence-card-observation">{panel.observation}</p>
          <div className="evidence-card-detail-grid">
            <span>
              <span className="meta-label">Severity</span>
              {panel.severity}
            </span>
            <span>
              <span className="meta-label">Confidence</span>
              {panel.confidence}%
            </span>
            <span>
              <span className="meta-label">Last Updated</span>
              {new Date(panel.lastUpdated).toLocaleTimeString()}
            </span>
          </div>
          {panel.realLines && (
            <ul className="evidence-card-raw">
              {panel.realLines.slice(0, 6).map((line, index) => (
                <li key={index}>{realLineText(line)}</li>
              ))}
            </ul>
          )}
        </div>
      )}
    </div>
  )
}

function PinnedAnomalies({ panels, activeCategory, onSelect }) {
  const pinned = derivePinnedAnomalies(panels)
  if (pinned.length === 0) return null

  return (
    <div className="evidence-pinned-strip">
      <span className="evidence-pinned-label">Pinned Anomalies</span>
      <div className="evidence-pinned-items">
        {pinned.map((panel) => (
          <button
            type="button"
            key={panel.key}
            className={`evidence-pinned-chip evidence-pinned-chip-${panel.status} ${
              panel.category === activeCategory ? 'active' : ''
            }`}
            onClick={() => onSelect(panel.category)}
            title={`${panel.category} · ${panel.observation}`}
          >
            <span className={`evidence-card-dot evidence-card-dot-${panel.status}`} />
            {panel.label}
            <span className="evidence-pinned-chip-rcl">{panel.rootCauseLikelihood}</span>
          </button>
        ))}
      </div>
    </div>
  )
}

// Fed entirely by the incident + investigation documents already loaded by
// IncidentDetails. The 7 real sources render actual investigation data; the
// remaining sources are deterministically synthesized in memory (seeded by
// incident id) so they're stable across reloads without any extra reads.
export function EvidenceWorkspace({ incident, investigation }) {
  const panels = synthesizeEvidence(incident, investigation)
  const [activeCategory, setActiveCategory] = useState(EVIDENCE_CATEGORIES[0])

  const filtered = panels.filter((panel) => panel.category === activeCategory)
  const anomalyCount = panels.filter((panel) => panel.status !== 'healthy').length

  return (
    <section className="evidence-workspace">
      <div className="evidence-workspace-header">
        <h2>Evidence &amp; Investigation Workspace</h2>
        <span className="evidence-workspace-summary">
          {panels.length} sources monitored · {anomalyCount} showing anomalies
        </span>
      </div>

      <PinnedAnomalies panels={panels} activeCategory={activeCategory} onSelect={setActiveCategory} />

      <div className="evidence-category-tabs">
        {EVIDENCE_CATEGORIES.map((category) => {
          const categoryPanels = panels.filter((panel) => panel.category === category)
          const anomalies = categoryPanels.filter((panel) => panel.status !== 'healthy').length

          return (
            <button
              key={category}
              type="button"
              className={`evidence-category-tab ${activeCategory === category ? 'active' : ''}`}
              onClick={() => setActiveCategory(category)}
            >
              {category}
              <span className="evidence-category-count">{categoryPanels.length}</span>
              {anomalies > 0 && <span className="evidence-category-anomaly-dot" />}
            </button>
          )
        })}
      </div>

      <div className="evidence-card-grid">
        {filtered.map((panel) => (
          <EvidenceCard key={panel.key} panel={panel} />
        ))}
      </div>
    </section>
  )
}

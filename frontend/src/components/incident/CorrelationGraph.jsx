import { useState } from 'react'
import { buildCorrelationGraph } from '../../utils/incidentAnalytics'
import './CorrelationGraph.css'

const STATUS_LABEL = { healthy: 'Healthy', warning: 'Warning', critical: 'Affected' }

// Fixed 13-node platform topology rendered entirely from the incident +
// investigation already loaded by IncidentDetails (service, severity,
// rootCause, aiAnalysis.impactedComponents/likelyRootCause). This is a visual
// explanation of the AI's reasoning, not a live topology editor or a new
// data source — no additional Firestore reads.
export function CorrelationGraph({ incident, investigation }) {
  const { nodes, edges, rootCauseNode } = buildCorrelationGraph(incident, investigation)
  const [hovered, setHovered] = useState(null)

  const nodeByName = Object.fromEntries(nodes.map((node) => [node.name, node]))
  const hoveredNode = hovered ? nodeByName[hovered] : null

  const affectedCount = nodes.filter((node) => node.status !== 'healthy').length

  let tooltipStyle = null
  let alignClass = ''
  if (hoveredNode) {
    const xPct = (hoveredNode.x / 1060) * 100
    const yPct = (hoveredNode.y / 440) * 100
    alignClass =
      (xPct < 15 ? 'align-left' : xPct > 85 ? 'align-right' : 'align-center') +
      ' ' +
      (yPct < 15 ? 'valign-below' : 'valign-above')
    tooltipStyle = { left: `${xPct}%`, top: `${yPct}%` }
  }

  return (
    <section className="correlation-graph">
      <div className="correlation-graph-header">
        <div>
          <h2>AI Correlation Graph</h2>
          <p className="correlation-graph-caption">
            How the AI investigation correlated the failing dependency chain to reach its root-cause conclusion.
          </p>
        </div>
        <div className="correlation-graph-legend">
          <span><i className="legend-dot legend-dot-healthy" />Healthy</span>
          <span><i className="legend-dot legend-dot-warning" />Warning</span>
          <span><i className="legend-dot legend-dot-critical" />Affected</span>
        </div>
      </div>

      {rootCauseNode && (
        <div className="correlation-graph-summary">
          <span className="correlation-summary-item">
            <span className="meta-label">Suspected Root Cause</span>
            {rootCauseNode}
          </span>
          <span className="correlation-summary-item">
            <span className="meta-label">Affected Components</span>
            {affectedCount} of {nodes.length}
          </span>
        </div>
      )}

      <div className="correlation-graph-canvas">
        <svg viewBox="0 0 1060 440" className="correlation-graph-svg" preserveAspectRatio="xMidYMid meet">
          {edges.map((edge, index) => {
            const from = nodeByName[edge.from]
            const to = nodeByName[edge.to]
            return (
              <line
                key={index}
                x1={from.x}
                y1={from.y}
                x2={to.x}
                y2={to.y}
                className={`correlation-edge ${edge.failed ? 'correlation-edge-failed' : ''}`}
              />
            )
          })}

          {nodes.map((node) => (
            <g
              key={node.name}
              className={`correlation-node correlation-node-${node.status} ${
                node.isRootCause ? 'correlation-node-root' : ''
              } ${hovered === node.name ? 'correlation-node-hovered' : ''}`}
              transform={`translate(${node.x}, ${node.y})`}
              onMouseEnter={() => setHovered(node.name)}
              onMouseLeave={() => setHovered((prev) => (prev === node.name ? null : prev))}
            >
              {node.isRootCause && <circle className="correlation-node-ring" r="21" />}
              <circle className="correlation-node-dot" r="13" />
              {node.isRootCause && (
                <text className="correlation-node-tag" y="-27">
                  ROOT CAUSE
                </text>
              )}
              <text className="correlation-node-label" y="29">
                {node.name}
              </text>
            </g>
          ))}
        </svg>

        {hoveredNode && (
          <div className={`correlation-tooltip ${alignClass}`} style={tooltipStyle}>
            <strong>{hoveredNode.name}</strong>
            <span>Health: {STATUS_LABEL[hoveredNode.status]}</span>
            <span>Latency: {hoveredNode.latencyMs}ms</span>
            <span>Errors: {hoveredNode.errorRate}%</span>
            <span>Contribution: {hoveredNode.contribution}</span>
            <span>Confidence: {hoveredNode.confidence}%</span>
          </div>
        )}
      </div>
    </section>
  )
}

import { Fragment } from 'react'
import './Heatmap.css'

function intensityColor(value, max) {
  if (max === 0) return 'rgba(79, 140, 255, 0.05)'
  const ratio = value / max
  return `rgba(79, 140, 255, ${0.08 + ratio * 0.82})`
}

export function Heatmap({ title, rowLabels, columnLabels, matrix }) {
  const maxValue = Math.max(0, ...matrix.flat())
  const hasData = maxValue > 0

  return (
    <div className="chart-card heatmap-card">
      <h3>{title}</h3>
      {!hasData ? (
        <p className="chart-empty">No activity data available.</p>
      ) : (
        <div className="heatmap-scroll">
          <div
            className="heatmap-grid"
            style={{
              gridTemplateColumns: `70px repeat(${columnLabels.length}, minmax(18px, 1fr))`,
            }}
          >
            <div className="heatmap-corner" />
            {columnLabels.map((label) => (
              <div className="heatmap-col-label" key={`col-${label}`}>
                {label}
              </div>
            ))}

            {rowLabels.map((rowLabel, rowIndex) => (
              <Fragment key={`row-${rowLabel}`}>
                <div className="heatmap-row-label">{rowLabel}</div>
                {matrix[rowIndex].map((value, colIndex) => (
                  <div
                    key={`${rowLabel}-${columnLabels[colIndex]}`}
                    className="heatmap-cell"
                    style={{ background: intensityColor(value, maxValue) }}
                    title={`${rowLabel} ${columnLabels[colIndex]}: ${value} incident(s)`}
                  >
                    {value > 0 ? value : ''}
                  </div>
                ))}
              </Fragment>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}

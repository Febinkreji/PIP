import { PieChart, Pie, Cell, Tooltip, Legend, ResponsiveContainer } from 'recharts'
import { THEME_COLORS } from './analyticsUtils'
import './ChartShared.css'

const SEVERITY_COLORS = {
  CRITICAL: THEME_COLORS.critical,
  HIGH: THEME_COLORS.high,
  MEDIUM: THEME_COLORS.medium,
  LOW: THEME_COLORS.low,
}

function ChartTooltip({ active, payload }) {
  if (!active || !payload || payload.length === 0) return null
  const entry = payload[0]

  return (
    <div className="chart-tooltip">
      <div className="chart-tooltip-label">{entry.name}</div>
      <div className="chart-tooltip-value">{entry.value} incidents</div>
    </div>
  )
}

export function SeverityChart({ data }) {
  const total = data.reduce((sum, entry) => sum + entry.count, 0)

  return (
    <div className="chart-card severity-chart">
      <h3>Severity Distribution</h3>
      {total === 0 ? (
        <p className="chart-empty">No incidents to distribute.</p>
      ) : (
        <div className="donut-wrapper">
          <ResponsiveContainer width="100%" height={280}>
            <PieChart>
              <Pie
                data={data}
                dataKey="count"
                nameKey="severity"
                innerRadius={70}
                outerRadius={100}
                paddingAngle={2}
                isAnimationActive
                animationDuration={900}
              >
                {data.map((entry) => (
                  <Cell key={entry.severity} fill={SEVERITY_COLORS[entry.severity] || THEME_COLORS.muted} />
                ))}
              </Pie>
              <Tooltip content={<ChartTooltip />} />
              <Legend verticalAlign="bottom" height={32} />
            </PieChart>
          </ResponsiveContainer>
          <div className="donut-center">
            <div className="donut-center-value">{total}</div>
            <div className="donut-center-label">Total Incidents</div>
          </div>
        </div>
      )}
    </div>
  )
}

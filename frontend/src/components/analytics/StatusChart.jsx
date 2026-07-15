import { BarChart, Bar, XAxis, YAxis, Tooltip, Cell, ResponsiveContainer } from 'recharts'
import { THEME_COLORS } from './analyticsUtils'
import './ChartShared.css'

const STATUS_COLORS = {
  OPEN: THEME_COLORS.high,
  TRIAGED: '#c084fc',
  INVESTIGATING: THEME_COLORS.accent,
  MITIGATING: THEME_COLORS.low,
  MONITORING: '#22c3d6',
  RESOLVED: THEME_COLORS.success,
  POSTMORTEM: THEME_COLORS.muted,
}

function ChartTooltip({ active, payload }) {
  if (!active || !payload || payload.length === 0) return null
  const entry = payload[0]

  return (
    <div className="chart-tooltip">
      <div className="chart-tooltip-label">{entry.payload.status}</div>
      <div className="chart-tooltip-value">{entry.value} incidents</div>
    </div>
  )
}

export function StatusChart({ data }) {
  const total = data.reduce((sum, entry) => sum + entry.count, 0)

  return (
    <div className="chart-card status-chart">
      <h3>Status Distribution</h3>
      {total === 0 ? (
        <p className="chart-empty">No status data available.</p>
      ) : (
        <ResponsiveContainer width="100%" height={260}>
          <BarChart
            data={data}
            layout="vertical"
            margin={{ top: 10, right: 24, bottom: 0, left: 10 }}
          >
            <XAxis type="number" stroke="#6b7280" fontSize={12} allowDecimals={false} />
            <YAxis
              type="category"
              dataKey="status"
              stroke="#6b7280"
              fontSize={12}
              width={110}
              tickLine={false}
            />
            <Tooltip content={<ChartTooltip />} cursor={{ fill: 'rgba(255,255,255,0.04)' }} />
            <Bar dataKey="count" radius={[0, 6, 6, 0]} isAnimationActive animationDuration={900}>
              {data.map((entry) => (
                <Cell key={entry.status} fill={STATUS_COLORS[entry.status] || THEME_COLORS.muted} />
              ))}
            </Bar>
          </BarChart>
        </ResponsiveContainer>
      )}
    </div>
  )
}

import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Brush,
  ResponsiveContainer,
} from 'recharts'
import { THEME_COLORS } from './analyticsUtils'
import './ChartShared.css'

function formatDateLabel(dateKey) {
  const date = new Date(`${dateKey}T00:00:00`)
  return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })
}

function ChartTooltip({ active, payload, label }) {
  if (!active || !payload || payload.length === 0) return null

  return (
    <div className="chart-tooltip">
      <div className="chart-tooltip-label">{formatDateLabel(label)}</div>
      <div className="chart-tooltip-value">{payload[0].value} incidents</div>
    </div>
  )
}

export function IncidentTrendChart({ data }) {
  return (
    <div className="chart-card incident-trend-chart">
      <h3>Incident Trend</h3>
      {data.length === 0 ? (
        <p className="chart-empty">No incident trend data available.</p>
      ) : (
        <ResponsiveContainer width="100%" height={320}>
          <AreaChart data={data} margin={{ top: 10, right: 20, bottom: 0, left: -10 }}>
            <defs>
              <linearGradient id="incident-trend-fill" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor={THEME_COLORS.accent} stopOpacity={0.45} />
                <stop offset="100%" stopColor={THEME_COLORS.accent} stopOpacity={0} />
              </linearGradient>
            </defs>
            <CartesianGrid strokeDasharray="3 3" stroke="#232838" vertical={false} />
            <XAxis
              dataKey="date"
              tickFormatter={formatDateLabel}
              stroke="#6b7280"
              fontSize={12}
              tickLine={false}
            />
            <YAxis stroke="#6b7280" fontSize={12} tickLine={false} allowDecimals={false} />
            <Tooltip content={<ChartTooltip />} />
            <Area
              type="monotone"
              dataKey="count"
              stroke={THEME_COLORS.accent}
              strokeWidth={2}
              fill="url(#incident-trend-fill)"
              isAnimationActive
              animationDuration={1000}
            />
            <Brush dataKey="date" height={22} stroke={THEME_COLORS.accent} tickFormatter={formatDateLabel} />
          </AreaChart>
        </ResponsiveContainer>
      )}
    </div>
  )
}

import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer } from 'recharts'
import { humanize } from './analyticsUtils'
import './ChartShared.css'

function ChartTooltip({ active, payload }) {
  if (!active || !payload || payload.length === 0) return null
  const entry = payload[0]

  return (
    <div className="chart-tooltip">
      <div className="chart-tooltip-label">{humanize(entry.payload.service)}</div>
      <div className="chart-tooltip-value">{entry.value} incidents</div>
    </div>
  )
}

export function ServiceChart({ data }) {
  const chartData = data.slice(0, 10)

  return (
    <div className="chart-card service-chart">
      <h3>Top Affected Services</h3>
      {chartData.length === 0 ? (
        <p className="chart-empty">No service data available.</p>
      ) : (
        <ResponsiveContainer width="100%" height={320}>
          <BarChart data={chartData} margin={{ top: 10, right: 10, bottom: 40, left: -10 }}>
            <defs>
              <linearGradient id="service-bar-fill" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor="#4f8cff" stopOpacity={1} />
                <stop offset="100%" stopColor="#4f8cff" stopOpacity={0.35} />
              </linearGradient>
            </defs>
            <XAxis
              dataKey="service"
              tickFormatter={humanize}
              stroke="#6b7280"
              fontSize={11}
              angle={-35}
              textAnchor="end"
              interval={0}
              height={60}
            />
            <YAxis stroke="#6b7280" fontSize={12} allowDecimals={false} />
            <Tooltip content={<ChartTooltip />} cursor={{ fill: 'rgba(255,255,255,0.04)' }} />
            <Bar
              dataKey="count"
              fill="url(#service-bar-fill)"
              radius={[6, 6, 0, 0]}
              isAnimationActive
              animationDuration={900}
            />
          </BarChart>
        </ResponsiveContainer>
      )}
    </div>
  )
}

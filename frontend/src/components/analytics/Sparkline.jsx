import { AreaChart, Area, ResponsiveContainer } from 'recharts'

export function Sparkline({ data, color = '#4f8cff', id }) {
  const points = data.map((value, index) => ({ index, value }))
  const gradientId = `sparkline-fill-${id}`

  return (
    <div className="sparkline">
      <ResponsiveContainer width="100%" height={40}>
        <AreaChart data={points} margin={{ top: 4, right: 0, bottom: 0, left: 0 }}>
          <defs>
            <linearGradient id={gradientId} x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor={color} stopOpacity={0.4} />
              <stop offset="100%" stopColor={color} stopOpacity={0} />
            </linearGradient>
          </defs>
          <Area
            type="monotone"
            dataKey="value"
            stroke={color}
            strokeWidth={2}
            fill={`url(#${gradientId})`}
            isAnimationActive
            animationDuration={900}
          />
        </AreaChart>
      </ResponsiveContainer>
    </div>
  )
}

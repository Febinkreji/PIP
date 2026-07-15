import { useCountUp } from './useCountUp'
import { Sparkline } from './Sparkline'
import './AnalyticsCard.css'

export function AnalyticsCard({
  icon,
  title,
  value,
  decimals = 0,
  suffix = '',
  trend,
  tone = 'accent',
  sparklineData,
  sparklineColor,
}) {
  const isNumeric = typeof value === 'number'
  const animatedValue = useCountUp(isNumeric ? value : 0, 1000)
  const displayValue = isNumeric ? animatedValue.toFixed(decimals) : value

  return (
    <div className={`analytics-card analytics-card-${tone}`}>
      <div className="analytics-card-header">
        <span className="analytics-card-icon" aria-hidden="true">
          {icon}
        </span>
        {trend && (
          <span className={`analytics-card-trend analytics-card-trend-${trend.tone}`}>
            {trend.direction === 'up' ? '▲' : trend.direction === 'down' ? '▼' : '—'}{' '}
            {trend.label}
          </span>
        )}
      </div>

      <div className="analytics-card-title">{title}</div>
      <div className="analytics-card-value">
        {displayValue}
        {suffix}
      </div>

      {sparklineData && (
        <Sparkline
          data={sparklineData}
          color={sparklineColor}
          id={title.replace(/\s+/g, '-').toLowerCase()}
        />
      )}
    </div>
  )
}

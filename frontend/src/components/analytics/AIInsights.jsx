import { humanize } from './analyticsUtils'
import './AIInsights.css'

function buildInsights(dashboardStats, analytics) {
  const insights = []
  const total = dashboardStats.totalIncidents || analytics.severityDistribution.reduce(
    (sum, entry) => sum + entry.count,
    0
  )

  const topService = analytics.topAffectedServices[0]
  if (topService && total > 0) {
    const percent = Math.round((topService.count / total) * 100)
    insights.push({
      text: `${humanize(topService.service)} generated ${percent}% of all recorded incidents.`,
      confidence: 96,
    })
  }

  if (total > 0) {
    const criticalPercent = Math.round((dashboardStats.criticalIncidents / total) * 100)
    insights.push({
      text: `Critical-severity incidents account for ${criticalPercent}% of total incident volume.`,
      confidence: 94,
    })
  }

  const trend = analytics.incidentTrend
  if (trend.length >= 2) {
    const latest = trend[trend.length - 1].count
    const average = trend.reduce((sum, point) => sum + point.count, 0) / trend.length
    const diff = Math.round(((latest - average) / (average || 1)) * 100)
    const direction = diff >= 0 ? 'above' : 'below'
    insights.push({
      text: `Incident volume on ${trend[trend.length - 1].date} was ${Math.abs(diff)}% ${direction} the ${trend.length}-day average.`,
      confidence: 89,
    })
  }

  if (total > 0) {
    const resolvedPercent = Math.round((dashboardStats.resolvedIncidents / total) * 100)
    insights.push({
      text: `${resolvedPercent}% of all incidents to date have reached RESOLVED status.`,
      confidence: 92,
    })
  }

  return insights
}

export function AIInsights({ dashboardStats, analytics }) {
  const insights = buildInsights(dashboardStats, analytics)

  return (
    <section className="ai-insights">
      <h2 className="analytics-section-title">AI Insights</h2>
      {insights.length === 0 ? (
        <p className="chart-empty">Not enough data yet to generate insights.</p>
      ) : (
        <div className="ai-insights-grid">
          {insights.map((insight) => (
            <div className="ai-insight-card" key={insight.text}>
              <div className="ai-insight-header">
                <span className="ai-insight-icon" aria-hidden="true">
                  ✨
                </span>
                <span className="ai-insight-badge">{insight.confidence}% confidence</span>
              </div>
              <div className="ai-insight-label">AI Insight</div>
              <p className="ai-insight-text">{insight.text}</p>
            </div>
          ))}
        </div>
      )}
    </section>
  )
}

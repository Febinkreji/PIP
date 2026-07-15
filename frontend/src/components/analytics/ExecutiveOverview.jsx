import { AnalyticsCard } from './AnalyticsCard'
import { THEME_COLORS, clamp, formatCompactCurrency } from './analyticsUtils'
import './ExecutiveOverview.css'

// Fed entirely by dashboardStats + analytics (both single-document reads) —
// merchantsImpacted and avgResolution used to be computed by scanning every
// incident client-side; both are now precomputed server-side instead.
export function ExecutiveOverview({ dashboardStats, analytics }) {
  const trendSeries = analytics.incidentTrend.map((point) => point.count)
  const sparkline = trendSeries.length > 1 ? trendSeries : [0, ...trendSeries]

  const merchantsImpacted = analytics.merchantDistribution.length

  const availability = clamp(100 - dashboardStats.criticalIncidents * 0.05, 95, 100)
  const revenueProtected = dashboardStats.resolvedIncidents * 42500
  const avgResolution = (analytics.resolutionStats?.avgResolutionMs || 0) / 60000

  const cards = [
    {
      icon: '💳',
      title: 'Payment Success Rate',
      value: dashboardStats.paymentSuccessRate,
      decimals: 1,
      suffix: '%',
      tone: dashboardStats.paymentSuccessRate >= 95 ? 'success' : 'critical',
      trend: { direction: 'up', label: 'stable', tone: 'good' },
      sparklineColor: THEME_COLORS.success,
    },
    {
      icon: '🔥',
      title: 'Open Incidents',
      value: dashboardStats.openIncidents,
      tone: dashboardStats.openIncidents > 0 ? 'warning' : 'success',
      trend: {
        direction: dashboardStats.openIncidents > 0 ? 'up' : 'flat',
        label: `${dashboardStats.openIncidents} active`,
        tone: dashboardStats.openIncidents > 0 ? 'bad' : 'neutral',
      },
      sparklineColor: THEME_COLORS.high,
    },
    {
      icon: '🚨',
      title: 'Critical Incidents',
      value: dashboardStats.criticalIncidents,
      tone: dashboardStats.criticalIncidents > 0 ? 'critical' : 'success',
      trend: {
        direction: dashboardStats.criticalIncidents > 0 ? 'up' : 'flat',
        label: 'severity: CRITICAL',
        tone: dashboardStats.criticalIncidents > 0 ? 'bad' : 'neutral',
      },
      sparklineColor: THEME_COLORS.critical,
    },
    {
      icon: '✅',
      title: 'Resolved Incidents',
      value: dashboardStats.resolvedIncidents,
      tone: 'success',
      trend: { direction: 'up', label: 'all time', tone: 'good' },
      sparklineColor: THEME_COLORS.success,
    },
    {
      icon: '🛠️',
      title: 'Healthy Services',
      value: `${dashboardStats.healthyServices.healthy}/${dashboardStats.healthyServices.total}`,
      tone:
        dashboardStats.healthyServices.healthy === dashboardStats.healthyServices.total
          ? 'success'
          : 'warning',
    },
    {
      icon: '⏱️',
      title: 'MTTR',
      value: dashboardStats.mttr,
      tone: 'accent',
    },
    {
      icon: '🎯',
      title: 'MTTD',
      value: dashboardStats.mttd,
      tone: 'accent',
    },
    {
      icon: '🟢',
      title: 'Availability',
      value: availability,
      decimals: 2,
      suffix: '%',
      tone: availability >= 99 ? 'success' : 'warning',
    },
    {
      icon: '💰',
      title: 'Revenue Protected (mock)',
      value: formatCompactCurrency(revenueProtected),
      tone: 'ai',
    },
    {
      icon: '🏬',
      title: 'Merchants Impacted',
      value: merchantsImpacted,
      tone: merchantsImpacted > 0 ? 'warning' : 'success',
    },
    {
      icon: '⏳',
      title: 'Avg Resolution Time',
      value: avgResolution,
      decimals: 0,
      suffix: 'm',
      tone: 'accent',
    },
  ]

  return (
    <section className="executive-overview">
      <h2 className="analytics-section-title">Executive Overview</h2>
      <div className="executive-overview-grid">
        {cards.map((card) => (
          <AnalyticsCard key={card.title} sparklineData={sparkline} {...card} />
        ))}
      </div>
    </section>
  )
}

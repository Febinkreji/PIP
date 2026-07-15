import { deriveImpactMetrics } from '../../utils/incidentAnalytics'
import '../RootCauseAnalysis.css'
import './ImpactPanel.css'

function formatCurrency(value) {
  return new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD', maximumFractionDigits: 0 }).format(value)
}

function formatNumber(value) {
  return new Intl.NumberFormat('en-US').format(value)
}

// Derived entirely from the already-loaded incident document (severity,
// merchant, region, psp) — no additional Firestore reads.
export function ImpactPanel({ incident }) {
  const impact = deriveImpactMetrics(incident)

  const stats = [
    { label: 'Revenue at Risk', value: formatCurrency(impact.revenueAtRisk), tone: 'critical' },
    { label: 'Customers Impacted', value: formatNumber(impact.customersImpacted), tone: 'warning' },
    { label: 'Failed Transactions', value: formatNumber(impact.failedTransactions), tone: 'warning' },
    { label: 'Success Rate', value: `${impact.successRate.toFixed(1)}%`, tone: impact.successRate < 90 ? 'critical' : 'medium' },
  ]

  return (
    <section className="impact-panel">
      <h2>Incident Impact</h2>

      <div className="impact-stat-grid">
        {stats.map((stat) => (
          <div className={`impact-stat impact-stat-${stat.tone}`} key={stat.label}>
            <span className="meta-label">{stat.label}</span>
            <span className="impact-stat-value">{stat.value}</span>
          </div>
        ))}
      </div>

      <div className="impact-chip-section">
        <div className="impact-chip-group">
          <span className="meta-label">Affected Merchants</span>
          <div className="rca-chip-row">
            {impact.affectedMerchants.length > 0 ? (
              impact.affectedMerchants.map((m) => <span className="rca-chip rca-chip-factor" key={m}>{m}</span>)
            ) : (
              <span className="impact-chip-empty">None recorded</span>
            )}
          </div>
        </div>

        <div className="impact-chip-group">
          <span className="meta-label">Affected Regions</span>
          <div className="rca-chip-row">
            {impact.affectedRegions.length > 0 ? (
              impact.affectedRegions.map((r) => <span className="rca-chip rca-chip-factor" key={r}>{r}</span>)
            ) : (
              <span className="impact-chip-empty">None recorded</span>
            )}
          </div>
        </div>

        <div className="impact-chip-group">
          <span className="meta-label">PSPs Impacted</span>
          <div className="rca-chip-row">
            {impact.pspsImpacted.length > 0 ? (
              impact.pspsImpacted.map((p) => <span className="rca-chip rca-chip-factor" key={p}>{p}</span>)
            ) : (
              <span className="impact-chip-empty">None recorded</span>
            )}
          </div>
        </div>

        <div className="impact-chip-group">
          <span className="meta-label">Payment Methods Impacted</span>
          <div className="rca-chip-row">
            {impact.paymentMethodsImpacted.map((p) => <span className="rca-chip rca-chip-factor" key={p}>{p}</span>)}
          </div>
        </div>
      </div>
    </section>
  )
}

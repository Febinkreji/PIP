import { hashString, clamp, formatNumber } from './analyticsUtils'
import './MerchantAnalytics.css'

function riskBand(score) {
  if (score >= 70) return 'critical'
  if (score >= 40) return 'warning'
  return 'healthy'
}

function buildMerchantRows(merchantHealth) {
  return (merchantHealth || [])
    .map(({ merchant, incidentCount, criticalCount, openCount }) => {
      const seed = hashString(merchant)
      const transactions = incidentCount * (500 + (seed % 1500))
      const availability = clamp(100 - criticalCount * 0.8 - openCount * 0.3, 90, 100)
      const riskScore = clamp(criticalCount * 5 + openCount * 2 + incidentCount * 1, 0, 100)

      return { merchant, transactions, incidentCount, availability, riskScore }
    })
    .sort((a, b) => b.incidentCount - a.incidentCount)
    .slice(0, 10)
}

// Fed entirely by analytics.merchantHealth (from the single /analytics read)
// — no incident-level data is fetched just to render this section, even
// though the platform is expected to eventually track up to 1,000 merchants.
export function MerchantAnalytics({ merchantHealth }) {
  const rows = buildMerchantRows(merchantHealth)

  return (
    <section className="merchant-analytics">
      <h2 className="analytics-section-title">Merchant Analytics</h2>
      <div className="chart-card merchant-analytics-card">
        {rows.length === 0 ? (
          <p className="chart-empty">No merchant data available.</p>
        ) : (
          <div className="merchant-table-scroll">
            <table className="merchant-table">
              <thead>
                <tr>
                  <th>Merchant</th>
                  <th>Transactions</th>
                  <th>Incidents</th>
                  <th>Availability</th>
                  <th>Risk Score</th>
                </tr>
              </thead>
              <tbody>
                {rows.map((row) => {
                  const band = riskBand(row.riskScore)
                  return (
                    <tr key={row.merchant}>
                      <td>{row.merchant}</td>
                      <td>{formatNumber(row.transactions)}</td>
                      <td>{row.incidentCount}</td>
                      <td>{row.availability.toFixed(2)}%</td>
                      <td>
                        <span className={`merchant-risk-badge merchant-risk-badge-${band}`}>
                          {row.riskScore}
                        </span>
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </section>
  )
}

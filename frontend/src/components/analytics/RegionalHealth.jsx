import './RegionalHealth.css'

const TILES = [
  { label: 'India', source: 'country', key: 'India' },
  { label: 'Singapore', source: 'country', key: 'Singapore' },
  { label: 'Europe', source: 'region', key: 'Europe' },
  { label: 'US', source: 'country', key: 'United States' },
  { label: 'Brazil', source: 'country', key: 'Brazil' },
  { label: 'Japan', source: 'country', key: 'Japan' },
]

const STATUS_LABEL = { healthy: 'Healthy', warning: 'Warning', critical: 'Critical' }

function computeStatus(health) {
  if (!health) return 'healthy'
  if (health.criticalCount > 0) return 'critical'
  if (health.openCount > 0) return 'warning'
  return 'healthy'
}

// Fed entirely by analytics.countryHealth / analytics.regionHealth (both part
// of the single /analytics read) — no incident-level data is fetched just to
// render this section.
export function RegionalHealth({ countryHealth, regionHealth }) {
  const countryByName = Object.fromEntries((countryHealth || []).map((entry) => [entry.country, entry]))
  const regionByName = Object.fromEntries((regionHealth || []).map((entry) => [entry.region, entry]))

  const tiles = TILES.map((tile) => {
    const health = tile.source === 'country' ? countryByName[tile.key] : regionByName[tile.key]
    return {
      label: tile.label,
      incidentCount: health ? health.incidentCount : 0,
      status: computeStatus(health),
    }
  })

  return (
    <section className="regional-health">
      <h2 className="analytics-section-title">Regional Analytics</h2>
      <div className="chart-card regional-health-card">
        <div className="regional-grid">
          {tiles.map((tile) => (
            <div className="regional-tile" key={tile.label}>
              <div className={`regional-dot regional-dot-${tile.status}`} />
              <div className="regional-info">
                <div className="regional-name">{tile.label}</div>
                <div className="regional-count">{tile.incidentCount} incidents</div>
              </div>
              <span className={`regional-badge regional-badge-${tile.status}`}>
                {STATUS_LABEL[tile.status]}
              </span>
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}

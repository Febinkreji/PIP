import { RadialBarChart, RadialBar, PolarAngleAxis } from 'recharts'
import './OperationalHealth.css'

const SERVICE_KEYWORDS = [
  { label: 'Database', keyword: 'database' },
  { label: 'Kafka', keyword: 'kafka' },
  { label: 'Redis', keyword: 'redis' },
  { label: 'PSP', keyword: 'psp' },
  { label: 'API Gateway', keyword: 'api' },
]

const STATUS_LABEL = { green: 'Healthy', yellow: 'Warning', red: 'Critical' }

// serviceHealth entries come from analytics.serviceHealth (the single
// /analytics read) — matched by keyword against service name, same grouping
// the UI always used, just fed by precomputed counts instead of a live scan.
function computeServiceStatus(serviceHealth, keyword) {
  const matching = serviceHealth.filter((entry) => (entry.service || '').toLowerCase().includes(keyword))

  if (matching.some((entry) => entry.criticalCount > 0)) return 'red'
  if (matching.some((entry) => entry.openCount > 0)) return 'yellow'
  return 'green'
}

export function OperationalHealth({ dashboardStats, serviceHealth }) {
  const successRate = dashboardStats.paymentSuccessRate
  const gaugeData = [
    {
      name: 'Success Rate',
      value: successRate,
      fill: successRate >= 95 ? '#2ecc71' : successRate >= 90 ? '#ff9f43' : '#ff4d4f',
    },
  ]

  const services = SERVICE_KEYWORDS.map(({ label, keyword }) => ({
    label,
    status: computeServiceStatus(serviceHealth || [], keyword),
  }))

  return (
    <section className="operational-health">
      <h2 className="analytics-section-title">Operational Health</h2>
      <div className="operational-health-grid">
        <div className="operational-health-card">
          <h3>Payment Success Rate</h3>
          <div className="gauge-wrapper">
            <RadialBarChart
              width={280}
              height={200}
              cx="50%"
              cy="100%"
              innerRadius="70%"
              outerRadius="100%"
              barSize={22}
              startAngle={180}
              endAngle={0}
              data={gaugeData}
            >
              <PolarAngleAxis type="number" domain={[0, 100]} angleAxisId={0} tick={false} />
              <RadialBar
                background
                dataKey="value"
                cornerRadius={12}
                isAnimationActive
                animationDuration={1200}
              />
            </RadialBarChart>
            <div className="gauge-value">{successRate.toFixed(1)}%</div>
          </div>
        </div>

        <div className="operational-health-card">
          <h3>System Health</h3>
          <ul className="service-status-list">
            {services.map((service) => (
              <li key={service.label} className="service-status-item">
                <span className={`service-status-dot service-status-dot-${service.status}`} />
                <span className="service-status-label">{service.label}</span>
                <span className={`service-status-badge service-status-badge-${service.status}`}>
                  {STATUS_LABEL[service.status]}
                </span>
              </li>
            ))}
          </ul>
        </div>
      </div>
    </section>
  )
}

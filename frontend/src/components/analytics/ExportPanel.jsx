import './ExportPanel.css'

function downloadCsv(incidents) {
  const headers = ['id', 'title', 'severity', 'status', 'service', 'merchant', 'region', 'createdAt']
  const rows = incidents.map((incident) =>
    headers.map((field) => JSON.stringify(incident[field] ?? '')).join(',')
  )
  const csvContent = [headers.join(','), ...rows].join('\n')

  const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' })
  const url = URL.createObjectURL(blob)
  const link = document.createElement('a')
  link.href = url
  link.download = `incident-analytics-${new Date().toISOString().slice(0, 10)}.csv`
  link.click()
  URL.revokeObjectURL(url)
}

export function ExportPanel({ incidents }) {
  return (
    <section className="export-panel">
      <h2 className="analytics-section-title">Export</h2>
      <div className="chart-card export-panel-card">
        <button type="button" onClick={() => window.print()}>
          Export PDF
        </button>
        <button type="button" onClick={() => downloadCsv(incidents)}>
          Export CSV
        </button>
        <button type="button" onClick={() => window.print()}>
          Print Dashboard
        </button>
      </div>
    </section>
  )
}

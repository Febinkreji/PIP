import { useState } from 'react'
import './AnalyticsFilters.css'

const SEVERITIES = ['LOW', 'MEDIUM', 'HIGH', 'CRITICAL']
const STATUSES = ['OPEN', 'TRIAGED', 'INVESTIGATING', 'MITIGATING', 'MONITORING', 'RESOLVED', 'POSTMORTEM']
const REGIONS = ['North America', 'Europe', 'APAC', 'LATAM', 'MEA']

const EMPTY_FILTERS = {
  date: '',
  merchant: '',
  psp: '',
  severity: '',
  status: '',
  service: '',
  region: '',
  engineer: '',
}

export function AnalyticsFilters({ onApply, onReset }) {
  const [filters, setFilters] = useState(EMPTY_FILTERS)

  function updateField(field, value) {
    setFilters((previous) => ({ ...previous, [field]: value }))
  }

  function handleSubmit(event) {
    event.preventDefault()
    onApply(filters)
  }

  function handleReset() {
    setFilters(EMPTY_FILTERS)
    onReset()
  }

  return (
    <form className="analytics-filters" onSubmit={handleSubmit}>
      <div className="analytics-filters-fields">
        <input
          type="date"
          value={filters.date}
          onChange={(e) => updateField('date', e.target.value)}
          title="Date"
        />
        <input
          type="text"
          placeholder="Merchant"
          value={filters.merchant}
          onChange={(e) => updateField('merchant', e.target.value)}
        />
        <input
          type="text"
          placeholder="PSP"
          value={filters.psp}
          onChange={(e) => updateField('psp', e.target.value)}
        />
        <select value={filters.severity} onChange={(e) => updateField('severity', e.target.value)}>
          <option value="">Severity</option>
          {SEVERITIES.map((value) => (
            <option key={value} value={value}>
              {value}
            </option>
          ))}
        </select>
        <select value={filters.status} onChange={(e) => updateField('status', e.target.value)}>
          <option value="">Status</option>
          {STATUSES.map((value) => (
            <option key={value} value={value}>
              {value}
            </option>
          ))}
        </select>
        <input
          type="text"
          placeholder="Service"
          value={filters.service}
          onChange={(e) => updateField('service', e.target.value)}
        />
        <select value={filters.region} onChange={(e) => updateField('region', e.target.value)}>
          <option value="">Region</option>
          {REGIONS.map((value) => (
            <option key={value} value={value}>
              {value}
            </option>
          ))}
        </select>
        <input
          type="text"
          placeholder="Engineer"
          value={filters.engineer}
          onChange={(e) => updateField('engineer', e.target.value)}
        />
      </div>

      <div className="analytics-filters-actions">
        <button type="submit" className="analytics-filters-search">
          Search
        </button>
        <button type="button" className="analytics-filters-reset" onClick={handleReset}>
          Reset
        </button>
      </div>
    </form>
  )
}

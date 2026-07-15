import { useState } from 'react'
import './SearchBar.css'

const SEVERITIES = ['LOW', 'MEDIUM', 'HIGH', 'CRITICAL']
const STATUSES = ['OPEN', 'TRIAGED', 'INVESTIGATING', 'MITIGATING', 'MONITORING', 'RESOLVED', 'POSTMORTEM']
const REGIONS = ['North America', 'Europe', 'APAC', 'LATAM', 'MEA']

const EMPTY_FILTERS = {
  merchant: '',
  psp: '',
  severity: '',
  status: '',
  service: '',
  region: '',
  date: '',
  correlationId: '',
  errorCode: '',
}

export function SearchBar({ onSearch, onClear }) {
  const [filters, setFilters] = useState(EMPTY_FILTERS)

  function updateField(field, value) {
    setFilters((previous) => ({ ...previous, [field]: value }))
  }

  function handleSubmit(event) {
    event.preventDefault()
    onSearch(filters)
  }

  function handleClear() {
    setFilters(EMPTY_FILTERS)
    onClear()
  }

  return (
    <form className="search-bar" onSubmit={handleSubmit}>
      <div className="search-bar-fields">
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
          {SEVERITIES.map((severity) => (
            <option key={severity} value={severity}>
              {severity}
            </option>
          ))}
        </select>
        <select value={filters.status} onChange={(e) => updateField('status', e.target.value)}>
          <option value="">Status</option>
          {STATUSES.map((status) => (
            <option key={status} value={status}>
              {status}
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
          {REGIONS.map((region) => (
            <option key={region} value={region}>
              {region}
            </option>
          ))}
        </select>
        <input
          type="date"
          value={filters.date}
          onChange={(e) => updateField('date', e.target.value)}
        />
        <input
          type="text"
          placeholder="Correlation ID (e.g. INC-000123)"
          value={filters.correlationId}
          onChange={(e) => updateField('correlationId', e.target.value)}
        />
        <input
          type="text"
          placeholder="Error Code"
          value={filters.errorCode}
          onChange={(e) => updateField('errorCode', e.target.value)}
        />
      </div>

      <div className="search-bar-actions">
        <button type="submit" className="search-bar-submit">
          Search
        </button>
        <button type="button" className="search-bar-clear" onClick={handleClear}>
          Clear
        </button>
      </div>
    </form>
  )
}

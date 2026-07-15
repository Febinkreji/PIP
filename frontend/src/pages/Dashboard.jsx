import { useEffect, useState } from 'react'
import { StatCard } from '../components/StatCard'
import { IncidentCard } from '../components/IncidentCard'
import { SearchBar } from '../components/SearchBar'
import { fetchJson } from '../api/client'
import './Dashboard.css'

const INCIDENTS_PAGE_SIZE = 12

function buildQuery(params) {
  const query = new URLSearchParams()
  Object.entries(params).forEach(([key, value]) => {
    if (value) query.set(key, value)
  })
  return query.toString()
}

export function Dashboard() {
  const [stats, setStats] = useState(null)
  const [status, setStatus] = useState('loading')

  const [incidentsPage, setIncidentsPage] = useState(null)
  const [incidentsCursor, setIncidentsCursor] = useState({ cursor: null, direction: 'next' })

  const [searchFilters, setSearchFilters] = useState(null)
  const [searchCursor, setSearchCursor] = useState({ cursor: null, direction: 'next' })
  const [searchResult, setSearchResult] = useState(null)
  const [searchStatus, setSearchStatus] = useState('idle')

  useEffect(() => {
    let isMounted = true
    setStatus('loading')

    fetchJson('/dashboard')
      .then((data) => {
        if (!isMounted) return
        setStats(data)
        setStatus('success')
      })
      .catch(() => {
        if (!isMounted) return
        setStatus('error')
      })

    return () => {
      isMounted = false
    }
  }, [])

  useEffect(() => {
    let isMounted = true

    const query = buildQuery({
      pageSize: INCIDENTS_PAGE_SIZE,
      cursor: incidentsCursor.cursor,
      direction: incidentsCursor.direction,
    })

    fetchJson(`/incidents?${query}`)
      .then((data) => {
        if (!isMounted) return
        setIncidentsPage(data)
      })
      .catch(() => {
        if (!isMounted) return
        setIncidentsPage(null)
      })

    return () => {
      isMounted = false
    }
  }, [incidentsCursor])

  useEffect(() => {
    if (!searchFilters) return undefined

    let isMounted = true
    setSearchStatus('loading')

    const query = buildQuery({
      ...searchFilters,
      pageSize: 12,
      cursor: searchCursor.cursor,
      direction: searchCursor.direction,
    })

    fetchJson(`/search?${query}`)
      .then((data) => {
        if (!isMounted) return
        setSearchResult(data)
        setSearchStatus('success')
      })
      .catch(() => {
        if (!isMounted) return
        setSearchStatus('error')
      })

    return () => {
      isMounted = false
    }
  }, [searchFilters, searchCursor])

  function handleSearch(filters) {
    setSearchCursor({ cursor: null, direction: 'next' })
    setSearchFilters(filters)
  }

  function handleClearSearch() {
    setSearchFilters(null)
    setSearchResult(null)
    setSearchStatus('idle')
    setSearchCursor({ cursor: null, direction: 'next' })
  }

  return (
    <div className="dashboard">
      <div className="dashboard-stats">
        {status === 'success' && stats && (
          <>
            <StatCard label="Payment Success Rate" value={`${stats.paymentSuccessRate}%`} />
            <StatCard
              label="Open Incidents"
              value={stats.openIncidents}
              tone={stats.openIncidents > 0 ? 'warning' : 'success'}
            />
            <StatCard
              label="Critical Incidents"
              value={stats.criticalIncidents}
              tone={stats.criticalIncidents > 0 ? 'critical' : 'success'}
            />
            <StatCard label="Resolved Incidents" value={stats.resolvedIncidents} tone="success" />
            <StatCard
              label="Healthy Services"
              value={`${stats.healthyServices.healthy}/${stats.healthyServices.total}`}
              tone={
                stats.healthyServices.healthy === stats.healthyServices.total
                  ? 'success'
                  : 'warning'
              }
            />
            <StatCard label="MTTR" value={stats.mttr} />
            <StatCard label="MTTD" value={stats.mttd} />
          </>
        )}
      </div>

      <div className="dashboard-section">
        <h2>Search Incidents</h2>
        <SearchBar onSearch={handleSearch} onClear={handleClearSearch} />

        {searchStatus === 'loading' && <p className="empty-state">Searching…</p>}

        {searchStatus === 'error' && (
          <p className="empty-state empty-state-error">Search failed. Is the backend running?</p>
        )}

        {searchStatus === 'success' && searchResult && searchResult.results.length === 0 && (
          <p className="empty-state">No incidents match your search.</p>
        )}

        {searchStatus === 'success' && searchResult && searchResult.results.length > 0 && (
          <>
            <div className="incident-grid">
              {searchResult.results.map((incident) => (
                <IncidentCard incident={incident} key={incident.id} />
              ))}
            </div>
            <div className="search-pagination">
              <button
                type="button"
                disabled={!searchResult.hasPreviousPage}
                onClick={() =>
                  setSearchCursor({ cursor: searchResult.previousCursor, direction: 'previous' })
                }
              >
                ← Previous
              </button>
              <span>{searchResult.total} results</span>
              <button
                type="button"
                disabled={!searchResult.hasNextPage}
                onClick={() => setSearchCursor({ cursor: searchResult.nextCursor, direction: 'next' })}
              >
                Next →
              </button>
            </div>
          </>
        )}
      </div>

      <div className="dashboard-section">
        <h2>Active Incidents</h2>

        {status === 'loading' && <p className="empty-state">Loading incidents…</p>}

        {status === 'error' && (
          <p className="empty-state empty-state-error">
            Unable to load dashboard. Is the backend running?
          </p>
        )}

        {status === 'success' && incidentsPage && incidentsPage.incidents.length === 0 && (
          <p className="empty-state">No active incidents</p>
        )}

        {status === 'success' && incidentsPage && incidentsPage.incidents.length > 0 && (
          <>
            <div className="incident-grid">
              {incidentsPage.incidents.map((incident) => (
                <IncidentCard incident={incident} key={incident.id} />
              ))}
            </div>
            <div className="search-pagination">
              <button
                type="button"
                disabled={!incidentsPage.hasPreviousPage}
                onClick={() =>
                  setIncidentsCursor({ cursor: incidentsPage.previousCursor, direction: 'previous' })
                }
              >
                ← Previous
              </button>
              <button
                type="button"
                disabled={!incidentsPage.hasNextPage}
                onClick={() =>
                  setIncidentsCursor({ cursor: incidentsPage.nextCursor, direction: 'next' })
                }
              >
                Next →
              </button>
            </div>
          </>
        )}
      </div>
    </div>
  )
}

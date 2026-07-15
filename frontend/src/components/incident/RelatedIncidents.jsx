import { useState } from 'react'
import { Link } from 'react-router-dom'
import { SeverityBadge, StatusBadge } from '../Badge'
import { fetchJson } from '../../api/client'
import './RelatedIncidents.css'

// Deliberately OPT-IN: viewing an incident never fires this query — it only
// runs when the user explicitly asks for it, so the page's steady-state
// Firestore cost stays at the 3 reads for incident/investigation/recommendation.
// Reuses the existing /search endpoint (already a single indexed query) —
// no new endpoint, no new collection, no scan.
export function RelatedIncidents({ incident }) {
  const [status, setStatus] = useState('idle')
  const [results, setResults] = useState([])

  const dimension = incident.merchant ? 'merchant' : incident.psp ? 'psp' : incident.errorCode ? 'errorCode' : 'service'
  const dimensionValue = incident[dimension] || incident.service
  const dimensionLabel = { merchant: 'merchant', psp: 'PSP', errorCode: 'error code', service: 'affected service' }[dimension]

  async function handleLoad() {
    setStatus('loading')
    try {
      const params = new URLSearchParams({ [dimension]: dimensionValue, pageSize: '6' })
      const data = await fetchJson(`/search?${params.toString()}`)
      setResults(data.results.filter((r) => r.id !== incident.id))
      setStatus('loaded')
    } catch {
      setStatus('error')
    }
  }

  return (
    <section className="related-incidents">
      <div className="related-incidents-header">
        <h2>Related Incidents</h2>
        {status === 'idle' && (
          <button type="button" className="related-incidents-load-button" onClick={handleLoad}>
            Show Related Incidents
          </button>
        )}
      </div>

      {status === 'idle' && (
        <p className="related-incidents-hint">
          Loads incidents sharing the same {dimensionLabel} ({dimensionValue}). Not fetched automatically.
        </p>
      )}

      {status === 'loading' && <p className="related-incidents-hint">Searching…</p>}
      {status === 'error' && <p className="related-incidents-hint">Could not load related incidents.</p>}

      {status === 'loaded' && (
        results.length === 0 ? (
          <p className="related-incidents-hint">No other incidents share this {dimensionLabel}.</p>
        ) : (
          <ul className="related-incidents-list">
            {results.map((related) => (
              <li key={related.id} className="related-incidents-item">
                <Link to={`/incidents/${related.id}`} className="related-incidents-link">
                  <span className="related-incidents-id">{related.id}</span>
                  <span className="related-incidents-title">{related.title}</span>
                  <span className="related-incidents-badges">
                    <SeverityBadge severity={related.severity} />
                    <StatusBadge status={related.status} />
                  </span>
                </Link>
              </li>
            ))}
          </ul>
        )
      )}
    </section>
  )
}

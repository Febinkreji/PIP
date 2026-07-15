import { useEffect, useState } from 'react'
import { useAuth } from '../../context/AuthContext'
import './AnalyticsHeader.css'

function formatClock(date) {
  return date.toLocaleTimeString('en-US', { hour12: false })
}

export function AnalyticsHeader({ lastRefresh, notificationCount, onRefresh }) {
  const { user, role } = useAuth()
  const [now, setNow] = useState(new Date())

  useEffect(() => {
    const interval = setInterval(() => setNow(new Date()), 1000)
    return () => clearInterval(interval)
  }, [])

  return (
    <header className="analytics-header">
      <div className="analytics-header-titles">
        <h1>PIP (Payment Incident Platform)</h1>
        <p>Analytics Dashboard</p>
      </div>

      <div className="analytics-header-status">
        <div className="analytics-header-clock">
          <span className="analytics-header-clock-label">Current Time</span>
          <span className="analytics-header-clock-value">{formatClock(now)}</span>
        </div>

        <div className="analytics-header-clock">
          <span className="analytics-header-clock-label">Last Refresh</span>
          <span className="analytics-header-clock-value">
            {lastRefresh ? formatClock(lastRefresh) : '—'}
          </span>
        </div>

        <button type="button" className="analytics-header-live" onClick={onRefresh}>
          <span className="analytics-header-pulse" />
          Live
        </button>

        <button type="button" className="analytics-header-icon-button" title="Notifications">
          🔔
          {notificationCount > 0 && (
            <span className="analytics-header-badge">{notificationCount}</span>
          )}
        </button>

        <div className="analytics-header-profile">
          <span className="analytics-header-profile-email">{user?.email}</span>
          {role && <span className="analytics-header-profile-role">{role}</span>}
        </div>
      </div>
    </header>
  )
}

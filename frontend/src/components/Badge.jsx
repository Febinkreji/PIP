import './Badge.css'

export function SeverityBadge({ severity }) {
  return (
    <span className={`badge badge-severity-${severity.toLowerCase()}`}>
      {severity}
    </span>
  )
}

export function StatusBadge({ status }) {
  return (
    <span className={`badge badge-status-${status.toLowerCase()}`}>
      {status}
    </span>
  )
}

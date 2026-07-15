export const WORKFLOW_STAGES = [
  'OPEN',
  'TRIAGED',
  'INVESTIGATING',
  'MITIGATING',
  'MONITORING',
  'RESOLVED',
  'POSTMORTEM',
]

export const STAGE_LABELS = {
  OPEN: 'Open',
  TRIAGED: 'Triaged',
  INVESTIGATING: 'Investigating',
  MITIGATING: 'Mitigating',
  MONITORING: 'Monitoring',
  RESOLVED: 'Resolved',
  POSTMORTEM: 'Postmortem',
}

export const STAGE_ICONS = {
  OPEN: '●',
  TRIAGED: '✓',
  INVESTIGATING: '⌕',
  MITIGATING: '⚡',
  MONITORING: '◉',
  RESOLVED: '✔',
  POSTMORTEM: '☰',
}

export const WORKFLOW_WRITE_ROLES = ['ADMIN', 'ENGINEER', 'MANAGER']

export function getStageIndex(stage) {
  return WORKFLOW_STAGES.indexOf(stage)
}

export function derivePriority(severity) {
  const map = { CRITICAL: 'P1', HIGH: 'P2', MEDIUM: 'P3', LOW: 'P4' }
  return map[severity] || 'P4'
}

export function formatElapsed(isoString) {
  const elapsedMs = Date.now() - new Date(isoString).getTime()
  const minutes = Math.floor(elapsedMs / 60000)

  if (minutes < 1) return 'just now'
  if (minutes < 60) return `${minutes}m`

  const hours = Math.floor(minutes / 60)
  if (hours < 24) return `${hours}h ${minutes % 60}m`

  const days = Math.floor(hours / 24)
  return `${days}d ${hours % 24}h`
}

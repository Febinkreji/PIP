export const THEME_COLORS = {
  accent: '#4f8cff',
  critical: '#ff4d4f',
  high: '#ff9f43',
  medium: '#ffd43b',
  low: '#38d9a9',
  success: '#2ecc71',
  ai: '#a374ff',
  muted: '#6b7280',
}

export function hashString(value) {
  let hash = 0
  for (let i = 0; i < value.length; i += 1) {
    hash = (hash * 31 + value.charCodeAt(i)) >>> 0
  }
  return hash
}

export function clamp(value, min, max) {
  return Math.min(Math.max(value, min), max)
}

export function humanize(value) {
  if (!value) return 'Unknown'
  return value
    .split(/[-_\s]+/)
    .map((word) => (word.toLowerCase() === 'api' ? 'API' : word.charAt(0).toUpperCase() + word.slice(1)))
    .join(' ')
}

export function formatNumber(value) {
  return new Intl.NumberFormat('en-US').format(value)
}

export function formatCompactCurrency(value) {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    notation: 'compact',
    maximumFractionDigits: 1,
  }).format(value)
}

export function groupCount(items, keyFn) {
  const counts = new Map()
  items.forEach((item) => {
    const key = keyFn(item) || 'Unknown'
    counts.set(key, (counts.get(key) || 0) + 1)
  })
  return Array.from(counts.entries()).map(([key, count]) => ({ key, count }))
}

export function dayOfWeekLabel(index) {
  const labels = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday']
  return labels[index]
}

export function buildHourDayMatrix(incidents) {
  const matrix = Array.from({ length: 7 }, () => Array(24).fill(0))

  incidents.forEach((incident) => {
    const date = new Date(incident.createdAt)
    const day = date.getDay()
    const hour = date.getHours()
    matrix[day][hour] += 1
  })

  return matrix
}

export function sumMatrixRows(matrix) {
  return matrix.map((row) => row.reduce((sum, value) => sum + value, 0))
}

const MONDAY_FIRST_ORDER = [1, 2, 3, 4, 5, 6, 0]

export function reorderMondayFirst(sundayFirstValues) {
  return MONDAY_FIRST_ORDER.map((index) => sundayFirstValues[index])
}

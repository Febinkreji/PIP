function parseBoolean(value) {
  if (value === null || value === undefined || value === '') return null

  const normalized = String(value).trim().toLowerCase()
  if (normalized === 'true') return true
  if (normalized === 'false') return false

  return null
}

module.exports = { parseBoolean }

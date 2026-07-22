function emptyToNull(value) {
  if (value === undefined) return null
  if (typeof value === 'string' && value.trim() === '') return null
  return value
}

module.exports = { emptyToNull }

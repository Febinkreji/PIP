// Source timestamps are JSON-string-encoded by the upstream system and then
// CSV-quoted on top of that, so the raw field arrives with literal quote
// characters still embedded (e.g. `"2026-07-06T11:37:49.287Z"` as data, not
// just as CSV quoting). Strip those before parsing.
function parseTimestamp(value) {
  if (value === null || value === undefined || value === '') return null

  const unwrapped = String(value).replace(/^"+|"+$/g, '').trim()
  if (unwrapped === '') return null

  const date = new Date(unwrapped)
  if (Number.isNaN(date.getTime())) return null

  return date.toISOString()
}

module.exports = { parseTimestamp }

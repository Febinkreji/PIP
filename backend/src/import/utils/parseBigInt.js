// Monetary values are kept as validated digit strings, never converted to a
// JS number — Postgres parses the string directly on insert, so precision is
// never at risk of floating-point loss (relevant well before Number.MAX_SAFE_INTEGER
// for values that could accumulate across a "payment journey").
function parseBigIntString(value) {
  if (value === null || value === undefined) return null

  const trimmed = String(value).trim()
  if (trimmed === '') return null

  if (!/^-?\d+$/.test(trimmed)) {
    throw new Error(`Invalid integer value: "${trimmed}"`)
  }

  return trimmed
}

module.exports = { parseBigIntString }

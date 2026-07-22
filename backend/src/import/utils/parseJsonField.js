// Validates that a raw CSV field is well-formed JSON and passes the ORIGINAL
// text straight through, rather than JSON.parse-ing it into a JS value.
//
// This matters for JSONB columns specifically: node-postgres serializes a
// bound JS array parameter using Postgres array literal syntax ("{a,b,c}"),
// not JSON array syntax ("[a,b,c]") — passing a parsed array/object here
// would silently corrupt every JSONB array column. Passing the already-valid
// JSON text lets Postgres parse it itself on the way into the column.
function parseJsonField(value) {
  if (value === null || value === undefined || value === '') return null

  const trimmed = String(value).trim()
  if (trimmed === '') return null

  JSON.parse(trimmed) // throws on malformed JSON — caller decides how to handle

  return trimmed
}

module.exports = { parseJsonField }

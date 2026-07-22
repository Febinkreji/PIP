// Deliberately separate from utils/batchInsert.js (used by the fact-table
// importer) rather than adding an ON CONFLICT option to it — this guarantees
// zero risk of changing the already-working fact-table insert path. `table`
// and `columns` always come from this module's own fixed dimension configs,
// never from CSV data, so there's no SQL-injection surface from the string
// interpolation below.
async function upsertBatch(client, { table, columns, rows, conflictTarget }) {
  if (rows.length === 0) return { attempted: 0 }

  const valueGroups = []
  const params = []
  let paramIndex = 1

  for (const row of rows) {
    const placeholders = columns.map(() => `$${paramIndex++}`)
    valueGroups.push(`(${placeholders.join(', ')})`)
    for (const column of columns) {
      params.push(row[column] === undefined ? null : row[column])
    }
  }

  const sql =
    `INSERT INTO ${table} (${columns.join(', ')}) VALUES ${valueGroups.join(', ')} ` +
    `ON CONFLICT (${conflictTarget}) DO NOTHING`

  await client.query(sql, params)

  return { attempted: rows.length }
}

module.exports = { upsertBatch }

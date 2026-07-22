// Generic parameterized bulk insert. `table` and `columns` always come from
// a dataset's own transformer config (never from CSV data), so there is no
// SQL-injection surface from building the column list into the query text.
async function batchInsert(client, { table, columns, rows }) {
  if (rows.length === 0) return { inserted: 0 }

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

  const sql = `INSERT INTO ${table} (${columns.join(', ')}) VALUES ${valueGroups.join(', ')}`
  await client.query(sql, params)

  return { inserted: rows.length }
}

module.exports = { batchInsert }

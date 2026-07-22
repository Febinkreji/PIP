const fs = require('fs')
const { parse } = require('csv-parse')

// Streams a CSV file row by row — the file is never read into memory as a
// whole. `onRow` is awaited before the next record is pulled from the
// parser, so a slow downstream write (batching into Postgres) naturally
// applies backpressure to the file read.
//
// `skip_records_with_error` lets a single malformed line (e.g. an unclosed
// quote) be reported via the `skip` event instead of aborting the entire
// stream — CSV-level parse failures are isolated the same way row-level
// validation/transform failures are further downstream.
async function streamCsvRows(filePath, onRow, onSkippedLine) {
  const parser = fs.createReadStream(filePath).pipe(
    parse({
      columns: true,
      bom: true,
      skip_empty_lines: true,
      relax_column_count: true,
      skip_records_with_error: true,
    })
  )

  if (onSkippedLine) {
    parser.on('skip', (err) => onSkippedLine(err))
  }

  let rowIndex = 0
  for await (const rawRow of parser) {
    rowIndex += 1
    await onRow(rawRow, rowIndex)
  }

  return rowIndex
}

module.exports = { streamCsvRows }

function formatProgress({ fileLabel, rowsProcessed, validCount, invalidCount, totalRows }) {
  const lines = [
    '',
    fileLabel,
    '',
    `Rows Processed: ${rowsProcessed.toLocaleString('en-US')}`,
    `Valid: ${validCount.toLocaleString('en-US')}`,
    `Invalid: ${invalidCount.toLocaleString('en-US')}`,
  ]

  if (totalRows) {
    const percent = Math.min((rowsProcessed / totalRows) * 100, 100).toFixed(1)
    lines.push(
      `Percent Complete: ${percent}% (${rowsProcessed.toLocaleString('en-US')} / ${totalRows.toLocaleString('en-US')})`
    )
  }

  return lines.join('\n')
}

function reportProgress(progress) {
  console.log(formatProgress(progress))
}

module.exports = { formatProgress, reportProgress }

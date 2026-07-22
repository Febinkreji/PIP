function logRowFailure({ datasetType, sourceFileName, rowIndex, reason }) {
  const entry = {
    datasetType,
    sourceFileName,
    rowIndex,
    reason,
    loggedAt: new Date().toISOString(),
  }

  console.error(`[import:${datasetType}] row ${rowIndex} failed in ${sourceFileName}: ${reason}`)

  return entry
}

module.exports = { logRowFailure }

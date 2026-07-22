const fs = require('fs')
const readline = require('readline')

// Approximate, fast row estimate for progress-percentage display only — a
// single streamed newline count, not a CSV parse. Embedded newlines inside
// quoted JSON fields can inflate this slightly, so it must never be treated
// as authoritative — only as a rough "percent complete" indicator.
async function countFileRows(filePath) {
  const rl = readline.createInterface({
    input: fs.createReadStream(filePath),
    crlfDelay: Infinity,
  })

  let lineCount = 0
  // eslint-disable-next-line no-unused-vars
  for await (const _line of rl) {
    lineCount += 1
  }

  return Math.max(lineCount - 1, 0) // minus header row
}

module.exports = { countFileRows }

const fs = require('fs')
const crypto = require('crypto')

// Streams the file through the hash rather than reading it whole, so
// multi-hundred-thousand-row CSVs don't get loaded into memory just to be
// checksummed.
function computeFileChecksum(filePath) {
  return new Promise((resolve, reject) => {
    const hash = crypto.createHash('sha256')
    const stream = fs.createReadStream(filePath)

    stream.on('data', (chunk) => hash.update(chunk))
    stream.on('end', () => resolve(hash.digest('hex')))
    stream.on('error', reject)
  })
}

module.exports = { computeFileChecksum }

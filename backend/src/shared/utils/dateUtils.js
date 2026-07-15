function nowIso() {
  return new Date().toISOString()
}

function toDateKey(isoString) {
  return isoString.slice(0, 10)
}

module.exports = { nowIso, toDateKey }

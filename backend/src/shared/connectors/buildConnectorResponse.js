const { nowIso } = require('../utils/dateUtils')

function buildConnectorResponse(source, data) {
  return {
    source,
    status: 'ok',
    collectedAt: nowIso(),
    data,
  }
}

module.exports = { buildConnectorResponse }

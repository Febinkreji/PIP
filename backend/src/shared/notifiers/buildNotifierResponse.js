const { nowIso } = require('../utils/dateUtils')

function buildNotifierResponse(provider, details) {
  return {
    provider,
    status: 'SENT',
    deliveredAt: nowIso(),
    details,
  }
}

module.exports = { buildNotifierResponse }

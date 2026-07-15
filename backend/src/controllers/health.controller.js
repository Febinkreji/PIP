const { getHealthStatus } = require('../services/health.service')

function getHealth(req, res) {
  const healthStatus = getHealthStatus()
  res.status(200).json(healthStatus)
}

module.exports = { getHealth }

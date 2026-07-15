const { getDashboardStats } = require('../services/dashboard.service')
const { sendErrorResponse } = require('../../../shared/responses/errorResponse')

async function getDashboardHandler(req, res) {
  try {
    const stats = await getDashboardStats()
    res.status(200).json(stats)
  } catch (error) {
    sendErrorResponse(res, error)
  }
}

module.exports = { getDashboardHandler }

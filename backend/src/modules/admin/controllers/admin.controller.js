const { recomputeStatistics } = require('../services/admin.service')
const { sendErrorResponse } = require('../../../shared/responses/errorResponse')

async function recomputeStatisticsHandler(req, res) {
  try {
    const result = await recomputeStatistics()
    res.status(200).json(result)
  } catch (error) {
    sendErrorResponse(res, error)
  }
}

module.exports = { recomputeStatisticsHandler }

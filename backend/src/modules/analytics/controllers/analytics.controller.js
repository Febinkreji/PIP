const { getAnalytics } = require('../services/analytics.service')
const { sendErrorResponse } = require('../../../shared/responses/errorResponse')

async function getAnalyticsHandler(req, res) {
  try {
    const analytics = await getAnalytics()
    res.status(200).json(analytics)
  } catch (error) {
    sendErrorResponse(res, error)
  }
}

module.exports = { getAnalyticsHandler }

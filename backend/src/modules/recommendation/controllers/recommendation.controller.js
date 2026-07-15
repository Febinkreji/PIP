const { getRecommendationByIncidentId } = require('../services/recommendation.service')
const { sendErrorResponse } = require('../../../shared/responses/errorResponse')

async function getRecommendationHandler(req, res) {
  try {
    const recommendation = await getRecommendationByIncidentId(req.params.incidentId)
    res.status(200).json(recommendation)
  } catch (error) {
    sendErrorResponse(res, error)
  }
}

module.exports = { getRecommendationHandler }

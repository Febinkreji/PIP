const { getInvestigationByIncidentId } = require('../services/investigation.service')
const { sendErrorResponse } = require('../../../shared/responses/errorResponse')

async function getInvestigationHandler(req, res) {
  try {
    const investigation = await getInvestigationByIncidentId(req.params.incidentId)
    res.status(200).json(investigation)
  } catch (error) {
    sendErrorResponse(res, error)
  }
}

module.exports = { getInvestigationHandler }

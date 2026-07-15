const { transitionIncidentStatus } = require('../services/workflow.service')
const { sendErrorResponse } = require('../../../shared/responses/errorResponse')
const { assertRequiredFields } = require('../../../shared/validators/requiredFields')

async function updateIncidentStatusHandler(req, res) {
  try {
    assertRequiredFields(req.body, ['status'])

    const actor = req.user?.email || req.user?.uid || 'System'
    const incident = await transitionIncidentStatus(req.params.id, req.body, actor)

    res.status(200).json(incident)
  } catch (error) {
    sendErrorResponse(res, error)
  }
}

module.exports = { updateIncidentStatusHandler }

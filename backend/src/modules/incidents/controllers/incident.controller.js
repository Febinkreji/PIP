const {
  createIncident,
  getIncidentsPage,
  getIncidentById,
} = require('../services/incident.service')
const { sendErrorResponse } = require('../../../shared/responses/errorResponse')

async function createIncidentHandler(req, res) {
  try {
    const incident = await createIncident(req.body)
    res.status(201).json(incident)
  } catch (error) {
    sendErrorResponse(res, error)
  }
}

async function getIncidentsHandler(req, res) {
  try {
    const { pageSize, cursor, direction } = req.query
    const page = await getIncidentsPage({ pageSize, cursor, direction })
    res.status(200).json(page)
  } catch (error) {
    sendErrorResponse(res, error)
  }
}

async function getIncidentByIdHandler(req, res) {
  try {
    const incident = await getIncidentById(req.params.id)
    res.status(200).json(incident)
  } catch (error) {
    sendErrorResponse(res, error)
  }
}

module.exports = {
  createIncidentHandler,
  getIncidentsHandler,
  getIncidentByIdHandler,
}

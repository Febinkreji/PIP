const { searchIncidents } = require('../services/search.service')
const { sendErrorResponse } = require('../../../shared/responses/errorResponse')

async function searchHandler(req, res) {
  try {
    const {
      merchant,
      psp,
      severity,
      status,
      service,
      region,
      date,
      correlationId,
      errorCode,
      pageSize,
      cursor,
      direction,
    } = req.query

    const result = await searchIncidents(
      { merchant, psp, severity, status, service, region, date, correlationId, errorCode },
      { pageSize, cursor, direction }
    )

    res.status(200).json(result)
  } catch (error) {
    sendErrorResponse(res, error)
  }
}

module.exports = { searchHandler }

const { setUserRole } = require('../services/auth.service')
const { sendErrorResponse } = require('../../../shared/responses/errorResponse')

async function getMeHandler(req, res) {
  res.status(200).json(req.user)
}

async function setRoleHandler(req, res) {
  try {
    const result = await setUserRole(req.body)
    res.status(200).json(result)
  } catch (error) {
    sendErrorResponse(res, error)
  }
}

module.exports = { getMeHandler, setRoleHandler }

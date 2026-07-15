const { sendNotification, getNotificationHistory } = require('../services/notification.service')
const { sendErrorResponse } = require('../../../shared/responses/errorResponse')

async function sendNotificationHandler(req, res) {
  try {
    const notification = await sendNotification(req.body)
    res.status(201).json(notification)
  } catch (error) {
    sendErrorResponse(res, error)
  }
}

async function getNotificationHistoryHandler(req, res) {
  try {
    const { incidentId } = req.query
    const notifications = await getNotificationHistory({ incidentId })
    res.status(200).json(notifications)
  } catch (error) {
    sendErrorResponse(res, error)
  }
}

module.exports = { sendNotificationHandler, getNotificationHistoryHandler }

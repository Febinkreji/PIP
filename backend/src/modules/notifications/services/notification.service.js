const db = require('../../../config/firebase/firebase')
const Notification = require('../models/notification.model')
const { assertRequiredFields } = require('../../../shared/validators/requiredFields')
const { assertValidEnum } = require('../../../shared/validators/enum')
const { COLLECTIONS } = require('../../../shared/constants/collections')
const { PROVIDERS } = require('../../../shared/constants/notificationProviders')
const { nowIso } = require('../../../shared/utils/dateUtils')
const { getIncidentById } = require('../../incidents/services/incident.service')

const slackNotifier = require('../../../notifiers/slack/slack.notifier')
const teamsNotifier = require('../../../notifiers/teams/teams.notifier')
const emailNotifier = require('../../../notifiers/email/email.notifier')
const pagerdutyNotifier = require('../../../notifiers/pagerduty/pagerduty.notifier')

const NOTIFIERS_BY_PROVIDER = {
  SLACK: slackNotifier,
  TEAMS: teamsNotifier,
  EMAIL: emailNotifier,
  PAGERDUTY: pagerdutyNotifier,
}

const REQUIRED_FIELDS = ['incidentId', 'provider', 'recipient', 'message']

function validateNotificationInput({ incidentId, provider, recipient, message }) {
  assertRequiredFields({ incidentId, provider, recipient, message }, REQUIRED_FIELDS)
  assertValidEnum(provider, PROVIDERS, 'provider')
}

async function sendNotification(data) {
  validateNotificationInput(data)

  const { incidentId, provider, recipient, message } = data
  const incident = await getIncidentById(incidentId)

  const notifier = NOTIFIERS_BY_PROVIDER[provider]
  const deliveryResult = await notifier.send({ recipient, message, incident })

  const now = nowIso()
  const notificationRef = db.collection(COLLECTIONS.NOTIFICATIONS).doc()

  const notification = new Notification({
    id: notificationRef.id,
    incidentId,
    provider,
    recipient,
    message,
    status: deliveryResult.status,
    deliveredAt: deliveryResult.deliveredAt,
    details: deliveryResult.details,
    createdAt: now,
  })

  await notificationRef.set({ ...notification })

  return notification
}

async function getNotificationHistory({ incidentId } = {}) {
  let query = db.collection(COLLECTIONS.NOTIFICATIONS)

  if (incidentId) {
    query = query.where('incidentId', '==', incidentId)
  }

  const snapshot = await query.get()
  const notifications = snapshot.docs.map((doc) => doc.data())

  notifications.sort((a, b) => (a.createdAt < b.createdAt ? 1 : -1))

  return notifications
}

module.exports = { sendNotification, getNotificationHistory }

const { buildNotifierResponse } = require('../../shared/notifiers/buildNotifierResponse')

async function send({ recipient, message, incident }) {
  const details = {
    to: recipient,
    subject: incident ? `[${incident.severity}] ${incident.title}` : 'Incident notification',
    body: message,
    mockMessageId: `email-mock-${Math.random().toString(36).slice(2, 10)}`,
  }

  return buildNotifierResponse('EMAIL', details)
}

module.exports = { send }

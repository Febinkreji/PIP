const { buildNotifierResponse } = require('../../shared/notifiers/buildNotifierResponse')

async function send({ recipient, message, incident }) {
  const details = {
    service: recipient,
    incidentKey: incident ? incident.id : undefined,
    summary: message,
    mockIncidentId: `pagerduty-mock-${Math.random().toString(36).slice(2, 10)}`,
  }

  return buildNotifierResponse('PAGERDUTY', details)
}

module.exports = { send }

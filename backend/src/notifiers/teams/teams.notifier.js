const { buildNotifierResponse } = require('../../shared/notifiers/buildNotifierResponse')

async function send({ recipient, message }) {
  const details = {
    channel: recipient,
    text: message,
    mockMessageId: `teams-mock-${Math.random().toString(36).slice(2, 10)}`,
  }

  return buildNotifierResponse('TEAMS', details)
}

module.exports = { send }

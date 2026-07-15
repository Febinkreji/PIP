const { buildNotifierResponse } = require('../../shared/notifiers/buildNotifierResponse')

async function send({ recipient, message }) {
  const details = {
    channel: recipient,
    text: message,
    mockMessageId: `slack-mock-${Math.random().toString(36).slice(2, 10)}`,
  }

  return buildNotifierResponse('SLACK', details)
}

module.exports = { send }

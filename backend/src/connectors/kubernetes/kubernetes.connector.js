const { buildConnectorResponse } = require('../../shared/connectors/buildConnectorResponse')

async function collect({ service = 'unknown-service', severity = 'MEDIUM' } = {}) {
  const isCritical = severity === 'CRITICAL'

  const data = {
    namespace: 'payments',
    deployment: service,
    pods: [
      {
        name: `${service}-1`,
        status: isCritical ? 'CrashLoopBackOff' : 'Running',
        restarts: isCritical ? 5 : 0,
      },
      {
        name: `${service}-2`,
        status: 'Running',
        restarts: isCritical ? 2 : 0,
      },
    ],
    events: isCritical
      ? [`Warning  BackOff   pod/${service}-1   Back-off restarting failed container`]
      : [`Normal   Scheduled pod/${service}-2   Successfully assigned`],
  }

  return buildConnectorResponse('kubernetes', data)
}

module.exports = { collect }

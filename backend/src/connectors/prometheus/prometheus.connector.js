const { buildConnectorResponse } = require('../../shared/connectors/buildConnectorResponse')

async function collect({ service = 'unknown-service', severity = 'MEDIUM' } = {}) {
  const isCritical = severity === 'CRITICAL'

  const data = {
    metrics: [
      { label: 'CPU Usage', value: isCritical ? '93%' : '54%', threshold: '80%' },
      { label: 'Memory Usage', value: isCritical ? '88%' : '61%', threshold: '85%' },
      { label: 'Pod Restarts (5m)', value: isCritical ? 4 : 0 },
      { label: 'Service', value: service },
    ],
  }

  return buildConnectorResponse('prometheus', data)
}

module.exports = { collect }

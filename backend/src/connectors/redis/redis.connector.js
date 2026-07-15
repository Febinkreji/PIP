const { buildConnectorResponse } = require('../../shared/connectors/buildConnectorResponse')

async function collect({ service = 'unknown-service', severity = 'MEDIUM' } = {}) {
  const isCritical = severity === 'CRITICAL'

  const data = {
    cluster: `${service}-cache`,
    metrics: [
      { label: 'Hit Rate', value: isCritical ? '81.2%' : '97.1%' },
      { label: 'Eviction Rate', value: isCritical ? 'elevated (4x baseline)' : 'normal' },
      { label: 'Memory Usage', value: isCritical ? '91%' : '62%' },
    ],
  }

  return buildConnectorResponse('redis', data)
}

module.exports = { collect }

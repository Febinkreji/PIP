const { buildConnectorResponse } = require('../../shared/connectors/buildConnectorResponse')

async function collect({ service = 'unknown-service', severity = 'MEDIUM' } = {}) {
  const isCritical = severity === 'CRITICAL'

  const data = {
    provider: 'Primary PSP',
    relatedService: service,
    metrics: [
      { label: 'Response Time', value: isCritical ? '2.8s' : '620ms' },
      { label: '5xx Rate', value: isCritical ? '14.2%' : '0.3%' },
    ],
    statusPageAcknowledged: false,
  }

  return buildConnectorResponse('psp', data)
}

module.exports = { collect }

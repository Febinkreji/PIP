const { buildConnectorResponse } = require('../../shared/connectors/buildConnectorResponse')

async function collect({ service = 'unknown-service', severity = 'MEDIUM' } = {}) {
  const isCritical = severity === 'CRITICAL'

  const data = {
    dashboard: `${service} - Payment Overview`,
    panels: [
      {
        label: 'Success Rate',
        value: isCritical ? '71.4%' : '96.8%',
        change: isCritical ? '-27.2%' : '-1.1%',
      },
      {
        label: 'Error Rate',
        value: isCritical ? '18.6%' : '2.1%',
        change: isCritical ? '+17.1%' : '+0.4%',
      },
      {
        label: 'Request Rate',
        value: isCritical ? '1,240 req/s' : '2,980 req/s',
        change: isCritical ? '-58%' : '-2%',
      },
    ],
  }

  return buildConnectorResponse('grafana', data)
}

module.exports = { collect }

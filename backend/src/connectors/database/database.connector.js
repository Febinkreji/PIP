const { buildConnectorResponse } = require('../../shared/connectors/buildConnectorResponse')

async function collect({ service = 'unknown-service', severity = 'MEDIUM' } = {}) {
  const isCritical = severity === 'CRITICAL'

  const data = {
    instance: `${service}-db-primary`,
    metrics: [
      {
        label: 'Write Latency (p95)',
        value: isCritical ? '210ms' : '42ms',
        baseline: '40ms',
      },
      { label: 'Active Connections', value: isCritical ? '196/200' : '84/200' },
      { label: 'Replication Lag', value: isCritical ? '3.2s' : '0.1s' },
    ],
  }

  return buildConnectorResponse('database', data)
}

module.exports = { collect }

const { buildConnectorResponse } = require('../../shared/connectors/buildConnectorResponse')

async function collect({ service = 'unknown-service', severity = 'MEDIUM' } = {}) {
  const isCritical = severity === 'CRITICAL'

  const data = {
    topic: `${service}-events`,
    consumerGroup: `${service}-workers`,
    metrics: [
      { label: 'Consumer Lag', value: isCritical ? 54000 : 1200, unit: 'messages' },
      { label: 'Partitions Rebalancing', value: isCritical ? 3 : 0 },
      { label: 'Throughput', value: isCritical ? '210 msg/s' : '860 msg/s' },
    ],
  }

  return buildConnectorResponse('kafka', data)
}

module.exports = { collect }

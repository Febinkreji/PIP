const { buildConnectorResponse } = require('../../shared/connectors/buildConnectorResponse')

async function collect({ service = 'unknown-service', severity = 'MEDIUM' } = {}) {
  const isCritical = severity === 'CRITICAL'

  const data = {
    query: `{service="${service}"} |= "ERROR"`,
    logs: isCritical
      ? [
          `level=error msg="unhandled exception while processing request" service=${service}`,
          `level=warn msg="retry budget exhausted after 3 attempts" service=${service}`,
          `level=error msg="downstream timeout after 8000ms" service=${service}`,
        ]
      : [
          `level=info msg="request processed successfully" service=${service}`,
          `level=warn msg="slow response detected (1.2s)" service=${service}`,
        ],
  }

  return buildConnectorResponse('loki', data)
}

module.exports = { collect }

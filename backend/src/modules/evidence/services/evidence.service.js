const grafanaConnector = require('../../../connectors/grafana/grafana.connector')
const lokiConnector = require('../../../connectors/loki/loki.connector')
const prometheusConnector = require('../../../connectors/prometheus/prometheus.connector')
const kafkaConnector = require('../../../connectors/kafka/kafka.connector')
const redisConnector = require('../../../connectors/redis/redis.connector')
const databaseConnector = require('../../../connectors/database/database.connector')
const kubernetesConnector = require('../../../connectors/kubernetes/kubernetes.connector')
const pspConnector = require('../../../connectors/psp/psp.connector')

function formatMetric(metric) {
  if (metric.threshold) return `${metric.label}: ${metric.value} (threshold ${metric.threshold})`
  if (metric.baseline) return `${metric.label}: ${metric.value} (baseline ${metric.baseline})`
  if (metric.unit) return `${metric.label}: ${metric.value} ${metric.unit}`
  return `${metric.label}: ${metric.value}`
}

async function collectEvidence(context) {
  const [grafana, loki, prometheus, kafka, redis, database, kubernetes, psp] = await Promise.all([
    grafanaConnector.collect(context),
    lokiConnector.collect(context),
    prometheusConnector.collect(context),
    kafkaConnector.collect(context),
    redisConnector.collect(context),
    databaseConnector.collect(context),
    kubernetesConnector.collect(context),
    pspConnector.collect(context),
  ])

  return {
    grafanaMetrics: grafana.data.panels,
    applicationLogs: loki.data.logs,
    database: [
      `instance: ${database.data.instance}`,
      ...database.data.metrics.map(formatMetric),
    ],
    kafka: [
      `topic: ${kafka.data.topic}`,
      `consumer group: ${kafka.data.consumerGroup}`,
      ...kafka.data.metrics.map(formatMetric),
    ],
    redis: [`cluster: ${redis.data.cluster}`, ...redis.data.metrics.map(formatMetric)],
    pspResponse: [
      `provider: ${psp.data.provider}`,
      ...psp.data.metrics.map(formatMetric),
      `status page acknowledged: ${psp.data.statusPageAcknowledged}`,
    ],
    infrastructureMetrics: [
      ...prometheus.data.metrics.map(formatMetric),
      ...kubernetes.data.pods.map(
        (pod) => `pod ${pod.name}: ${pod.status}, restarts=${pod.restarts}`
      ),
      ...kubernetes.data.events,
    ],
  }
}

module.exports = { collectEvidence }

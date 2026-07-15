function correlateGrafana(metrics, service) {
  const errorRateMetric = metrics.find((metric) => metric.label === 'Error Rate')
  const errorRate = errorRateMetric ? parseFloat(errorRateMetric.value) : 0

  if (errorRate >= 15) {
    return {
      confidence: 92,
      reason: `Grafana shows ${service} error rate at ${errorRateMetric.value}, far above normal.`,
    }
  }
  if (errorRate >= 5) {
    return {
      confidence: 65,
      reason: `Grafana shows ${service} error rate at ${errorRateMetric.value}, moderately elevated.`,
    }
  }
  return {
    confidence: 20,
    reason: `Grafana shows ${service} error rate within normal range.`,
  }
}

function correlateLoki(logs, service) {
  const errorCount = logs.filter((line) => /level=error/i.test(line)).length
  const ratio = logs.length > 0 ? errorCount / logs.length : 0

  if (ratio >= 0.5) {
    return {
      confidence: 88,
      reason: `${errorCount} of ${logs.length} ${service} log lines are ERROR-level.`,
    }
  }
  if (errorCount > 0) {
    return {
      confidence: 55,
      reason: `${errorCount} of ${logs.length} ${service} log lines are ERROR-level.`,
    }
  }
  return { confidence: 15, reason: `No ERROR-level log lines detected for ${service}.` }
}

function correlateDatabase(lines, service) {
  const latencyLine = lines.find((line) => line.startsWith('Write Latency'))
  const match = latencyLine && latencyLine.match(/([\d.]+)ms \(baseline ([\d.]+)ms\)/)

  if (match) {
    const current = parseFloat(match[1])
    const baseline = parseFloat(match[2])
    const ratio = current / baseline

    if (ratio >= 4) {
      return {
        confidence: 85,
        reason: `${service} database write latency (${current}ms) is ${ratio.toFixed(1)}x baseline (${baseline}ms).`,
      }
    }
    if (ratio >= 1.5) {
      return {
        confidence: 50,
        reason: `${service} database write latency (${current}ms) is ${ratio.toFixed(1)}x baseline (${baseline}ms).`,
      }
    }
  }
  return { confidence: 15, reason: `${service} database write latency is within baseline.` }
}

function correlateKafka(lines, service) {
  const rebalanceLine = lines.find((line) => line.startsWith('Partitions Rebalancing'))
  const rebalancing = rebalanceLine ? parseInt(rebalanceLine.split(':')[1], 10) : 0

  if (rebalancing >= 2) {
    return {
      confidence: 80,
      reason: `${rebalancing} Kafka partitions rebalancing for ${service}.`,
    }
  }
  if (rebalancing === 1) {
    return { confidence: 45, reason: `1 Kafka partition rebalancing for ${service}.` }
  }
  return { confidence: 15, reason: `No Kafka partition rebalancing detected for ${service}.` }
}

function correlateRedis(lines, service) {
  const evictionLine = lines.find((line) => line.startsWith('Eviction Rate'))
  const isElevated = evictionLine && evictionLine.includes('elevated')

  if (isElevated) {
    return {
      confidence: 70,
      reason: `${service} Redis cache eviction rate is ${evictionLine.split(': ')[1]}.`,
    }
  }
  return { confidence: 15, reason: `${service} Redis cache eviction rate is normal.` }
}

function correlatePsp(lines, service) {
  const rateLine = lines.find((line) => line.startsWith('5xx Rate'))
  const rate = rateLine ? parseFloat(rateLine.split(':')[1]) : 0

  if (rate >= 10) {
    return {
      confidence: 90,
      reason: `PSP 5xx rate at ${rate}% for ${service}, indicating widespread upstream failures.`,
    }
  }
  if (rate >= 2) {
    return { confidence: 50, reason: `PSP 5xx rate at ${rate}% for ${service}, moderately elevated.` }
  }
  return { confidence: 15, reason: `PSP 5xx rate at ${rate}% for ${service}, within normal range.` }
}

function correlateInfrastructure(lines, service) {
  const crashLooping = lines.filter((line) => line.includes('CrashLoopBackOff')).length
  const restartsLine = lines.find((line) => line.startsWith('Pod Restarts'))
  const restarts = restartsLine ? parseInt(restartsLine.split(':')[1], 10) : 0

  if (crashLooping > 0) {
    return {
      confidence: 95,
      reason: `${crashLooping} ${service} pod(s) in CrashLoopBackOff.`,
    }
  }
  if (restarts >= 3) {
    return { confidence: 60, reason: `${restarts} ${service} pod restarts in the last 5 minutes.` }
  }
  return { confidence: 15, reason: `No pod instability detected for ${service}.` }
}

function correlateEvidence(incident, evidence) {
  const service = incident.service

  const results = [
    { source: 'grafana', ...correlateGrafana(evidence.grafanaMetrics, service) },
    { source: 'loki', ...correlateLoki(evidence.applicationLogs, service) },
    { source: 'database', ...correlateDatabase(evidence.database, service) },
    { source: 'kafka', ...correlateKafka(evidence.kafka, service) },
    { source: 'redis', ...correlateRedis(evidence.redis, service) },
    { source: 'psp', ...correlatePsp(evidence.pspResponse, service) },
    { source: 'infrastructure', ...correlateInfrastructure(evidence.infrastructureMetrics, service) },
  ]

  return results.sort((a, b) => b.confidence - a.confidence)
}

module.exports = { correlateEvidence }

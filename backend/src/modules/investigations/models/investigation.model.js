class Investigation {
  constructor({
    incidentId,
    grafanaMetrics,
    applicationLogs,
    database,
    kafka,
    redis,
    pspResponse,
    infrastructureMetrics,
    aiAnalysis,
    timeline,
    createdAt,
  }) {
    this.incidentId = incidentId
    this.grafanaMetrics = grafanaMetrics
    this.applicationLogs = applicationLogs
    this.database = database
    this.kafka = kafka
    this.redis = redis
    this.pspResponse = pspResponse
    this.infrastructureMetrics = infrastructureMetrics
    this.aiAnalysis = aiAnalysis
    this.timeline = timeline
    this.createdAt = createdAt
  }
}

module.exports = Investigation

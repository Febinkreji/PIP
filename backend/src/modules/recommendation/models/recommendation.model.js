class Recommendation {
  constructor({
    incidentId,
    recommendedActions,
    risk,
    estimatedRecoveryTime,
    runbookLink,
    createdAt,
  }) {
    this.incidentId = incidentId
    this.recommendedActions = recommendedActions
    this.risk = risk
    this.estimatedRecoveryTime = estimatedRecoveryTime
    this.runbookLink = runbookLink
    this.createdAt = createdAt
  }
}

module.exports = Recommendation

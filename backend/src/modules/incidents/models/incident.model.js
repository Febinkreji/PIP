class Incident {
  constructor({
    id,
    title,
    description,
    severity,
    status,
    service,
    createdAt,
    updatedAt,
    workflowHistory,
    currentStageStartedAt,
    owner,
    team,
    resolutionSummary,
    resolvedAt,
    postmortemCompleted,
  }) {
    this.id = id
    this.title = title
    this.description = description
    this.severity = severity
    this.status = status
    this.service = service
    this.createdAt = createdAt
    this.updatedAt = updatedAt
    this.workflowHistory = workflowHistory
    this.currentStageStartedAt = currentStageStartedAt
    this.owner = owner
    this.team = team
    this.resolutionSummary = resolutionSummary
    this.resolvedAt = resolvedAt
    this.postmortemCompleted = postmortemCompleted
  }
}

module.exports = Incident

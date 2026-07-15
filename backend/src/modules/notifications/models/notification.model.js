class Notification {
  constructor({
    id,
    incidentId,
    provider,
    recipient,
    message,
    status,
    deliveredAt,
    details,
    createdAt,
  }) {
    this.id = id
    this.incidentId = incidentId
    this.provider = provider
    this.recipient = recipient
    this.message = message
    this.status = status
    this.deliveredAt = deliveredAt
    this.details = details
    this.createdAt = createdAt
  }
}

module.exports = Notification

function getHealthStatus() {
  return {
    status: 'OK',
    service: 'PIP (Payment Incident Platform) Backend',
    version: '1.0.0',
  }
}

module.exports = { getHealthStatus }

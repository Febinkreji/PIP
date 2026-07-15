function sendErrorResponse(res, error) {
  const statusCode = error.statusCode || 500
  res.status(statusCode).json({ error: error.message })
}

module.exports = { sendErrorResponse }

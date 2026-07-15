function getApiStatus(req, res) {
  res.status(200).json({
    message: 'Backend Connected Successfully',
    version: '1.0.0',
  })
}

module.exports = { getApiStatus }

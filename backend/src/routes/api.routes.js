const { Router } = require('express')
const { getApiStatus } = require('../controllers/api.controller')

const router = Router()

router.get('/api', getApiStatus)

module.exports = router

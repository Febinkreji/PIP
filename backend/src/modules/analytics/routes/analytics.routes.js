const { Router } = require('express')
const { getAnalyticsHandler } = require('../controllers/analytics.controller')
const { authenticate } = require('../../../middlewares/authenticate.middleware')

const router = Router()

router.get('/analytics', authenticate, getAnalyticsHandler)

module.exports = router

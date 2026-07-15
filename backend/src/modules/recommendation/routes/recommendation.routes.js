const { Router } = require('express')
const { getRecommendationHandler } = require('../controllers/recommendation.controller')
const { authenticate } = require('../../../middlewares/authenticate.middleware')

const router = Router()

router.get('/recommendations/:incidentId', authenticate, getRecommendationHandler)

module.exports = router

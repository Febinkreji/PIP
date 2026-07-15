const { Router } = require('express')
const { getDashboardHandler } = require('../controllers/dashboard.controller')
const { authenticate } = require('../../../middlewares/authenticate.middleware')

const router = Router()

router.get('/dashboard', authenticate, getDashboardHandler)

module.exports = router

const { Router } = require('express')
const { getInvestigationHandler } = require('../controllers/investigation.controller')
const { authenticate } = require('../../../middlewares/authenticate.middleware')

const router = Router()

router.get('/investigations/:incidentId', authenticate, getInvestigationHandler)

module.exports = router

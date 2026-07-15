const { Router } = require('express')
const {
  createIncidentHandler,
  getIncidentsHandler,
  getIncidentByIdHandler,
} = require('../controllers/incident.controller')
const { authenticate } = require('../../../middlewares/authenticate.middleware')
const { requireRole } = require('../../../middlewares/requireRole.middleware')
const { WRITE_ROLES } = require('../../../shared/constants/roles')

const router = Router()

router.post('/incidents', authenticate, requireRole(...WRITE_ROLES), createIncidentHandler)
router.get('/incidents', authenticate, getIncidentsHandler)
router.get('/incidents/:id', authenticate, getIncidentByIdHandler)

module.exports = router

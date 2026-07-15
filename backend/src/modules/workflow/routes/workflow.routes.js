const { Router } = require('express')
const { updateIncidentStatusHandler } = require('../controllers/workflow.controller')
const { authenticate } = require('../../../middlewares/authenticate.middleware')
const { requireRole } = require('../../../middlewares/requireRole.middleware')
const { WRITE_ROLES } = require('../../../shared/constants/roles')

const router = Router()

router.patch(
  '/incidents/:id/status',
  authenticate,
  requireRole(...WRITE_ROLES),
  updateIncidentStatusHandler
)

module.exports = router

const { Router } = require('express')
const { recomputeStatisticsHandler } = require('../controllers/admin.controller')
const { authenticate } = require('../../../middlewares/authenticate.middleware')
const { requireRole } = require('../../../middlewares/requireRole.middleware')

const router = Router()

// The only endpoint in this codebase permitted to scan the entire incidents
// collection. ADMIN-only: rebuilds every precomputed summary document from
// scratch. Used once to backfill pre-existing incidents and afterward only
// for disaster recovery.
router.post('/admin/recompute-statistics', authenticate, requireRole('ADMIN'), recomputeStatisticsHandler)

module.exports = router

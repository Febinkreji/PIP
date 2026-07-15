const { Router } = require('express')
const { getMeHandler, setRoleHandler } = require('../controllers/auth.controller')
const { authenticate } = require('../../../middlewares/authenticate.middleware')
const { requireRole } = require('../../../middlewares/requireRole.middleware')

const router = Router()

router.get('/auth/me', authenticate, getMeHandler)
router.post('/auth/roles', authenticate, requireRole('ADMIN'), setRoleHandler)

module.exports = router

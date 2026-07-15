const { Router } = require('express')
const {
  sendNotificationHandler,
  getNotificationHistoryHandler,
} = require('../controllers/notification.controller')
const { authenticate } = require('../../../middlewares/authenticate.middleware')
const { requireRole } = require('../../../middlewares/requireRole.middleware')
const { WRITE_ROLES } = require('../../../shared/constants/roles')

const router = Router()

router.post('/notifications', authenticate, requireRole(...WRITE_ROLES), sendNotificationHandler)
router.get('/notifications', authenticate, getNotificationHistoryHandler)

module.exports = router

const { Router } = require('express')
const { searchHandler } = require('../controllers/search.controller')
const { authenticate } = require('../../../middlewares/authenticate.middleware')

const router = Router()

router.get('/search', authenticate, searchHandler)

module.exports = router

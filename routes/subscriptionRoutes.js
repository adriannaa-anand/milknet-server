const express = require('express')
const router  = express.Router()

const {
  subscribe, getMySubscription, cancelSubscription,
  toggleAutoPay, getMySubscribers
} = require('../controllers/subscriptionController')
const { protect, requireRole } = require('../middleware/authMiddleware')

router.post('/',                         protect, requireRole('customer'), subscribe)
router.get('/my',                        protect, requireRole('customer'), getMySubscription)
router.patch('/:id/cancel',              protect, requireRole('customer'), cancelSubscription)
router.patch('/:id/autopay',             protect, requireRole('customer'), toggleAutoPay)
router.get('/milkman/subscribers',       protect, requireRole('milkman'),  getMySubscribers)

module.exports = router

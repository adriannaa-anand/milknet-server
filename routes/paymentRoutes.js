const express = require('express')
const router  = express.Router()

const {
  createOrder, verifyPayment, getMyPayments,
  getMilkmanPayments, getMySummary
} = require('../controllers/paymentController')
const { protect, requireRole } = require('../middleware/authMiddleware')

router.post('/create-order', protect, requireRole('customer'), createOrder)
router.post('/verify',       protect, requireRole('customer'), verifyPayment)
router.get('/my',            protect, requireRole('customer'), getMyPayments)
router.get('/summary',       protect, requireRole('customer'), getMySummary)
router.get('/milkman',       protect, requireRole('milkman'),  getMilkmanPayments)

module.exports = router

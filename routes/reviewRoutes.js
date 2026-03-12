const express = require('express')
const router  = express.Router()

const { addReview, getMilkmanReviews, deleteReview } = require('../controllers/reviewController')
const { protect, requireRole, optionalAuth } = require('../middleware/authMiddleware')

router.get('/:milkmanId',    optionalAuth, getMilkmanReviews)
router.post('/:milkmanId',   protect, requireRole('customer'), addReview)
router.delete('/:reviewId',  protect, deleteReview)

module.exports = router

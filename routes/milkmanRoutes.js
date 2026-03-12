const express = require('express')
const router  = express.Router()

const {
  getAllMilkmen, getMilkmanById, getMyProfile,
  updateMyProfile, toggleAvailability
} = require('../controllers/milkmanController')
const { protect, requireRole, optionalAuth } = require('../middleware/authMiddleware')

// Public — anyone can browse milkmen
router.get('/',    optionalAuth, getAllMilkmen)
router.get('/me',  protect, requireRole('milkman'), getMyProfile)
router.get('/:id', optionalAuth, getMilkmanById)

// Milkman-only
router.patch('/me',              protect, requireRole('milkman'), updateMyProfile)
router.patch('/me/availability', protect, requireRole('milkman'), toggleAvailability)

module.exports = router

const express  = require('express')
const { body } = require('express-validator')
const router   = express.Router()

const { register, login, getMe, updateProfile, changePassword } = require('../controllers/authController')
const { protect } = require('../middleware/authMiddleware')
const validate    = require('../middleware/validate')

// Validation rules
const registerRules = [
  body('name').trim().notEmpty().withMessage('Name is required'),
  body('email').isEmail().withMessage('Valid email required').normalizeEmail(),
  body('password').isLength({ min: 6 }).withMessage('Password must be at least 6 characters'),
  body('role').optional().isIn(['customer', 'milkman']).withMessage('Role must be customer or milkman'),
]

const loginRules = [
  body('email').isEmail().withMessage('Valid email required').normalizeEmail(),
  body('password').notEmpty().withMessage('Password required'),
]

// Public routes
router.post('/register', registerRules, validate, register)
router.post('/login',    loginRules,    validate, login)

// Protected routes
router.get('/me',               protect, getMe)
router.patch('/update-profile', protect, updateProfile)
router.patch('/change-password',protect, changePassword)

module.exports = router

const jwt      = require('jsonwebtoken')
const User     = require('../models/User')
const Milkman  = require('../models/Milkman')
const asyncHandler = require('../middleware/errorHandler')

// ── Helper: sign JWT ──────────────────────────────────────────────────────────
const signToken = (id) =>
  jwt.sign({ id }, process.env.JWT_SECRET, { expiresIn: process.env.JWT_EXPIRES_IN || '7d' })

const sendAuth = (res, statusCode, user, message) => {
  const token = signToken(user._id)
  res.status(statusCode).json({ success: true, message, token, user })
}

// ── POST /api/auth/register ───────────────────────────────────────────────────
const register = asyncHandler(async (req, res) => {
  const { name, email, password, role = 'customer', phone } = req.body

  const exists = await User.findOne({ email })
  if (exists) return res.status(400).json({ success: false, message: 'Email already registered' })

  const user = await User.create({ name, email, password, role, phone })

  // If registering as milkman, create a draft Milkman profile automatically
  let milkmanProfile = null
  if (role === 'milkman') {
    milkmanProfile = await Milkman.create({
      user:  user._id,
      name:  user.name,
      area:  '',
      price: 0,
      milkType: [],
      schedule: [],
    })
  }

  sendAuth(res, 201, user, `Registered as ${role} successfully`)
})

// ── POST /api/auth/login ──────────────────────────────────────────────────────
const login = asyncHandler(async (req, res) => {
  const { email, password } = req.body
  if (!email || !password)
    return res.status(400).json({ success: false, message: 'Email and password required' })

  const user = await User.findOne({ email }).select('+password')
  if (!user || !(await user.comparePassword(password)))
    return res.status(401).json({ success: false, message: 'Invalid email or password' })

  user.lastLogin = new Date()
  await user.save({ validateBeforeSave: false })

  sendAuth(res, 200, user.toJSON(), 'Login successful')
})

// ── GET /api/auth/me ──────────────────────────────────────────────────────────
const getMe = asyncHandler(async (req, res) => {
  const user = await User.findById(req.user._id)
  res.json({ success: true, user })
})

// ── PATCH /api/auth/update-profile ───────────────────────────────────────────
const updateProfile = asyncHandler(async (req, res) => {
  const { name, phone, address, area } = req.body
  const user = await User.findByIdAndUpdate(
    req.user._id,
    { name, phone, address, area },
    { new: true, runValidators: true }
  )
  res.json({ success: true, message: 'Profile updated', user })
})

// ── PATCH /api/auth/change-password ──────────────────────────────────────────
const changePassword = asyncHandler(async (req, res) => {
  const { currentPassword, newPassword } = req.body
  const user = await User.findById(req.user._id).select('+password')

  if (!(await user.comparePassword(currentPassword)))
    return res.status(400).json({ success: false, message: 'Current password incorrect' })

  user.password = newPassword
  await user.save()

  sendAuth(res, 200, user.toJSON(), 'Password changed successfully')
})

module.exports = { register, login, getMe, updateProfile, changePassword }

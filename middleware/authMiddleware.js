const jwt  = require('jsonwebtoken')
const User = require('../models/User')

/**
 * protect — verifies JWT and attaches req.user
 */
const protect = async (req, res, next) => {
  try {
    const authHeader = req.headers.authorization
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({ success: false, message: 'Not authorised — no token' })
    }

    const token = authHeader.split(' ')[1]
    const decoded = jwt.verify(token, process.env.JWT_SECRET)

    const user = await User.findById(decoded.id).select('-password')
    if (!user) return res.status(401).json({ success: false, message: 'User no longer exists' })
    if (!user.isActive) return res.status(401).json({ success: false, message: 'Account deactivated' })

    req.user = user
    next()
  } catch (err) {
    return res.status(401).json({ success: false, message: 'Token invalid or expired' })
  }
}

/**
 * requireRole — restrict access to specific roles
 * Usage: requireRole('milkman') or requireRole('customer', 'milkman')
 */
const requireRole = (...roles) => (req, res, next) => {
  if (!roles.includes(req.user.role)) {
    return res.status(403).json({
      success: false,
      message: `Access denied — requires role: ${roles.join(' or ')}`,
    })
  }
  next()
}

/**
 * optionalAuth — attaches user if token present, continues if not
 */
const optionalAuth = async (req, res, next) => {
  try {
    const authHeader = req.headers.authorization
    if (authHeader && authHeader.startsWith('Bearer ')) {
      const token   = authHeader.split(' ')[1]
      const decoded = jwt.verify(token, process.env.JWT_SECRET)
      req.user      = await User.findById(decoded.id).select('-password')
    }
  } catch (_) { /* ignore */ }
  next()
}

module.exports = { protect, requireRole, optionalAuth }

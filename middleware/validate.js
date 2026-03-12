const { validationResult } = require('express-validator')

/**
 * Run express-validator checks and short-circuit with 400 if any fail.
 * Usage: validate after your array of check() calls.
 */
const validate = (req, res, next) => {
  const errors = validationResult(req)
  if (!errors.isEmpty()) {
    return res.status(400).json({
      success: false,
      message: 'Validation failed',
      errors:  errors.array().map(e => ({ field: e.path, message: e.msg })),
    })
  }
  next()
}

module.exports = validate

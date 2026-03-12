const mongoose = require('mongoose')
const bcrypt   = require('bcryptjs')

const userSchema = new mongoose.Schema({
  name:     { type: String, required: true, trim: true },
  email:    { type: String, required: true, unique: true, lowercase: true, trim: true },
  password: { type: String, required: true, minlength: 6, select: false },
  role:     { type: String, enum: ['customer', 'milkman'], default: 'customer' },
  phone:    { type: String, trim: true },
  avatar:   { type: String, default: '' },

  // Customer-specific
  address:  { type: String },
  area:     { type: String },

  // Milkman subscription reference
  subscribedMilkman: { type: mongoose.Schema.Types.ObjectId, ref: 'Milkman' },

  isActive:     { type: Boolean, default: true },
  lastLogin:    { type: Date },
  createdAt:    { type: Date, default: Date.now },
}, { timestamps: true })

// Hash password before save
userSchema.pre('save', async function (next) {
  if (!this.isModified('password')) return next()
  const salt = await bcrypt.genSalt(12)
  this.password = await bcrypt.hash(this.password, salt)
  next()
})

// Compare password
userSchema.methods.comparePassword = async function (entered) {
  return bcrypt.compare(entered, this.password)
}

// Remove password from JSON output
userSchema.methods.toJSON = function () {
  const obj = this.toObject()
  delete obj.password
  return obj
}

module.exports = mongoose.model('User', userSchema)

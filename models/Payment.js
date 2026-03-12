const mongoose = require('mongoose')

const paymentSchema = new mongoose.Schema({
  customer: { type: mongoose.Schema.Types.ObjectId, ref: 'User',    required: true },
  milkman:  { type: mongoose.Schema.Types.ObjectId, ref: 'Milkman', required: true },

  // Razorpay fields
  razorpayOrderId:   { type: String },   // order_XXXX
  razorpayPaymentId: { type: String },   // pay_XXXX — set after success
  razorpaySignature: { type: String },   // verification signature

  amount:      { type: Number, required: true },  // in ₹
  currency:    { type: String, default: 'INR' },
  method:      { type: String, enum: ['upi', 'card', 'netbanking', 'wallet', 'other'], default: 'other' },

  status:      { type: String, enum: ['created', 'paid', 'failed', 'refunded'], default: 'created' },

  description: { type: String },   // "March Subscription"
  month:       { type: String },   // "2025-03"
  type:        { type: String, enum: ['subscription', 'extra', 'advance'], default: 'subscription' },

  paidAt:      { type: Date },
}, { timestamps: true })

// Index for fast lookups
paymentSchema.index({ customer: 1, createdAt: -1 })
paymentSchema.index({ milkman:  1, createdAt: -1 })
paymentSchema.index({ razorpayOrderId: 1 })

module.exports = mongoose.model('Payment', paymentSchema)

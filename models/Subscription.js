const mongoose = require('mongoose')

const subscriptionSchema = new mongoose.Schema({
  customer: { type: mongoose.Schema.Types.ObjectId, ref: 'User',    required: true },
  milkman:  { type: mongoose.Schema.Types.ObjectId, ref: 'Milkman', required: true },

  litresPerDay:   { type: Number, default: 1 },
  pricePerLitre:  { type: Number, required: true },
  deliveryDays:   [{ type: String }],

  status:    { type: String, enum: ['active', 'paused', 'cancelled'], default: 'active' },
  startDate: { type: Date, default: Date.now },
  endDate:   { type: Date },

  autoPay:   { type: Boolean, default: false },
}, { timestamps: true })

// One active subscription per customer
subscriptionSchema.index({ customer: 1, status: 1 })

module.exports = mongoose.model('Subscription', subscriptionSchema)

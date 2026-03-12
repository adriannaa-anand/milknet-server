const mongoose = require('mongoose')

const reviewSchema = new mongoose.Schema({
  milkman:  { type: mongoose.Schema.Types.ObjectId, ref: 'Milkman', required: true },
  customer: { type: mongoose.Schema.Types.ObjectId, ref: 'User',    required: true },
  rating:   { type: Number, required: true, min: 1, max: 5 },
  comment:  { type: String, maxlength: 500 },
}, { timestamps: true })

// One review per customer per milkman
reviewSchema.index({ milkman: 1, customer: 1 }, { unique: true })

// After save — recalculate milkman's average rating
reviewSchema.post('save', async function () {
  const Milkman = require('./Milkman')
  const stats = await mongoose.model('Review').aggregate([
    { $match: { milkman: this.milkman } },
    { $group: { _id: '$milkman', avg: { $avg: '$rating' }, count: { $sum: 1 }, total: { $sum: '$rating' } } },
  ])
  if (stats.length > 0) {
    await Milkman.findByIdAndUpdate(this.milkman, {
      'reviewSummary.averageRating': Math.round(stats[0].avg * 10) / 10,
      'reviewSummary.reviewCount':   stats[0].count,
      'reviewSummary.totalRating':   stats[0].total,
    })
  }
})

module.exports = mongoose.model('Review', reviewSchema)

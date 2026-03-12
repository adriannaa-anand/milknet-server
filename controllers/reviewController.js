const Review   = require('../models/Review')
const Milkman  = require('../models/Milkman')
const asyncHandler = require('../middleware/errorHandler')

// ── POST /api/reviews/:milkmanId ──────────────────────────────────────────────
const addReview = asyncHandler(async (req, res) => {
  const { rating, comment } = req.body
  const { milkmanId } = req.params

  if (!rating || rating < 1 || rating > 5)
    return res.status(400).json({ success: false, message: 'Rating must be between 1 and 5' })

  const milkman = await Milkman.findById(milkmanId)
  if (!milkman)
    return res.status(404).json({ success: false, message: 'Milkman not found' })

  // Upsert — update if already reviewed, else create
  const review = await Review.findOneAndUpdate(
    { milkman: milkmanId, customer: req.user._id },
    { rating, comment },
    { new: true, upsert: true, setDefaultsOnInsert: true, runValidators: true }
  ).populate('customer', 'name avatar')

  res.status(201).json({ success: true, message: 'Review submitted', review })
})

// ── GET /api/reviews/:milkmanId ───────────────────────────────────────────────
const getMilkmanReviews = asyncHandler(async (req, res) => {
  const { page = 1, limit = 10 } = req.query
  const skip  = (Number(page) - 1) * Number(limit)
  const total = await Review.countDocuments({ milkman: req.params.milkmanId })

  const reviews = await Review.find({ milkman: req.params.milkmanId })
    .populate('customer', 'name avatar')
    .sort({ createdAt: -1 })
    .skip(skip)
    .limit(Number(limit))

  res.json({ success: true, count: reviews.length, total, reviews })
})

// ── DELETE /api/reviews/:reviewId ─────────────────────────────────────────────
const deleteReview = asyncHandler(async (req, res) => {
  const review = await Review.findById(req.params.reviewId)
  if (!review)
    return res.status(404).json({ success: false, message: 'Review not found' })

  if (review.customer.toString() !== req.user._id.toString())
    return res.status(403).json({ success: false, message: 'Not authorised to delete this review' })

  await review.deleteOne()
  res.json({ success: true, message: 'Review deleted' })
})

module.exports = { addReview, getMilkmanReviews, deleteReview }

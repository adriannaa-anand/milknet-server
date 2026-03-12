const Milkman      = require('../models/Milkman')
const Review       = require('../models/Review')
const asyncHandler = require('../middleware/errorHandler')

// ── GET /api/milkmen  — list all milkmen (with search & filter) ───────────────
const getAllMilkmen = asyncHandler(async (req, res) => {
  const { search, available, sort = 'rating', page = 1, limit = 20 } = req.query

  const query = {}

  if (search) {
    query.$or = [
      { name:  new RegExp(search, 'i') },
      { area:  new RegExp(search, 'i') },
      { milkType: { $elemMatch: { $regex: search, $options: 'i' } } },
    ]
  }

  if (available === 'true')  query.available = true
  if (available === 'false') query.available = false

  const sortMap = {
    rating:     { 'reviewSummary.averageRating': -1 },
    reviews:    { 'reviewSummary.reviewCount':   -1 },
    'price-low':  { price:  1 },
    'price-high': { price: -1 },
  }
  const sortObj = sortMap[sort] || sortMap.rating

  const skip  = (Number(page) - 1) * Number(limit)
  const total = await Milkman.countDocuments(query)

  const milkmen = await Milkman.find(query)
    .populate('user', 'name email phone avatar')
    .sort(sortObj)
    .skip(skip)
    .limit(Number(limit))

  res.json({
    success: true,
    count:   milkmen.length,
    total,
    pages:   Math.ceil(total / Number(limit)),
    currentPage: Number(page),
    milkmen,
  })
})

// ── GET /api/milkmen/:id ──────────────────────────────────────────────────────
const getMilkmanById = asyncHandler(async (req, res) => {
  const milkman = await Milkman.findById(req.params.id)
    .populate('user', 'name email phone avatar')

  if (!milkman)
    return res.status(404).json({ success: false, message: 'Milkman not found' })

  // Fetch reviews separately and attach
  const reviews = await Review.find({ milkman: milkman._id })
    .populate('customer', 'name avatar')
    .sort({ createdAt: -1 })
    .limit(10)

  res.json({ success: true, milkman: { ...milkman.toObject(), reviews } })
})

// ── GET /api/milkmen/me  — milkman's own profile ──────────────────────────────
const getMyProfile = asyncHandler(async (req, res) => {
  const milkman = await Milkman.findOne({ user: req.user._id })
    .populate('user', 'name email phone')

  if (!milkman)
    return res.status(404).json({ success: false, message: 'Milkman profile not found' })

  res.json({ success: true, milkman })
})

// ── PATCH /api/milkmen/me  — update own profile ───────────────────────────────
const updateMyProfile = asyncHandler(async (req, res) => {
  const { area, price, about, deliveryTime, milkType, schedule, available, color } = req.body

  const milkman = await Milkman.findOneAndUpdate(
    { user: req.user._id },
    { area, price, about, deliveryTime, milkType, schedule, available, color },
    { new: true, runValidators: true }
  )

  if (!milkman)
    return res.status(404).json({ success: false, message: 'Milkman profile not found' })

  res.json({ success: true, message: 'Profile updated', milkman })
})

// ── PATCH /api/milkmen/me/availability ───────────────────────────────────────
const toggleAvailability = asyncHandler(async (req, res) => {
  const milkman = await Milkman.findOne({ user: req.user._id })
  if (!milkman)
    return res.status(404).json({ success: false, message: 'Milkman profile not found' })

  milkman.available = !milkman.available
  await milkman.save()

  res.json({
    success: true,
    message: `Now ${milkman.available ? 'available' : 'unavailable'}`,
    available: milkman.available,
  })
})

module.exports = { getAllMilkmen, getMilkmanById, getMyProfile, updateMyProfile, toggleAvailability }

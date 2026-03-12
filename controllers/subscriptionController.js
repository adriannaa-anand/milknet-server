const Subscription = require('../models/Subscription')
const Milkman      = require('../models/Milkman')
const asyncHandler = require('../middleware/errorHandler')

// ── POST /api/subscriptions ────────────────────────────────────────────────────
const subscribe = asyncHandler(async (req, res) => {
  const { milkmanId, litresPerDay = 1, deliveryDays } = req.body

  const milkman = await Milkman.findById(milkmanId)
  if (!milkman)
    return res.status(404).json({ success: false, message: 'Milkman not found' })
  if (!milkman.available)
    return res.status(400).json({ success: false, message: 'This milkman is currently unavailable' })

  // Cancel any existing active subscription
  await Subscription.updateMany(
    { customer: req.user._id, status: 'active' },
    { status: 'cancelled', endDate: new Date() }
  )

  const sub = await Subscription.create({
    customer:      req.user._id,
    milkman:       milkmanId,
    litresPerDay,
    pricePerLitre: milkman.price,
    deliveryDays:  deliveryDays || milkman.schedule,
    status:        'active',
  })

  // Increment milkman customer count
  await Milkman.findByIdAndUpdate(milkmanId, { $inc: { customerCount: 1 } })

  await sub.populate([
    { path: 'milkman', select: 'name area price initials color' },
    { path: 'customer', select: 'name email' },
  ])

  res.status(201).json({ success: true, message: 'Subscribed successfully', subscription: sub })
})

// ── GET /api/subscriptions/my ──────────────────────────────────────────────────
const getMySubscription = asyncHandler(async (req, res) => {
  const sub = await Subscription.findOne({ customer: req.user._id, status: 'active' })
    .populate('milkman', 'name area price initials color deliveryTime phone')

  res.json({ success: true, subscription: sub || null })
})

// ── PATCH /api/subscriptions/:id/cancel ───────────────────────────────────────
const cancelSubscription = asyncHandler(async (req, res) => {
  const sub = await Subscription.findOne({ _id: req.params.id, customer: req.user._id })
  if (!sub)
    return res.status(404).json({ success: false, message: 'Subscription not found' })

  sub.status  = 'cancelled'
  sub.endDate = new Date()
  await sub.save()

  await Milkman.findByIdAndUpdate(sub.milkman, { $inc: { customerCount: -1 } })

  res.json({ success: true, message: 'Subscription cancelled' })
})

// ── PATCH /api/subscriptions/:id/autopay ──────────────────────────────────────
const toggleAutoPay = asyncHandler(async (req, res) => {
  const sub = await Subscription.findOne({ _id: req.params.id, customer: req.user._id })
  if (!sub) return res.status(404).json({ success: false, message: 'Subscription not found' })

  sub.autoPay = !sub.autoPay
  await sub.save()

  res.json({
    success:  true,
    message:  `Auto-pay ${sub.autoPay ? 'enabled' : 'disabled'}`,
    autoPay:  sub.autoPay,
  })
})

// ── GET /api/subscriptions/milkman — milkman sees their subscribers ────────────
const getMySubscribers = asyncHandler(async (req, res) => {
  const milkman = await Milkman.findOne({ user: req.user._id })
  if (!milkman) return res.status(404).json({ success: false, message: 'Milkman profile not found' })

  const subscribers = await Subscription.find({ milkman: milkman._id, status: 'active' })
    .populate('customer', 'name email phone area')

  res.json({ success: true, count: subscribers.length, subscribers })
})

module.exports = { subscribe, getMySubscription, cancelSubscription, toggleAutoPay, getMySubscribers }

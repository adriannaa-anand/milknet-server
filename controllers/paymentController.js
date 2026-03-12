const crypto   = require('crypto')
const razorpay = require('../config/razorpay')
const Payment  = require('../models/Payment')
const Milkman  = require('../models/Milkman')
const asyncHandler = require('../middleware/errorHandler')

// ── POST /api/payments/create-order ──────────────────────────────────────────
// Step 1: Create a Razorpay order — frontend gets order_id and opens Razorpay modal
const createOrder = asyncHandler(async (req, res) => {
  const { milkmanId, amount, description, type = 'subscription', month } = req.body

  if (!milkmanId || !amount)
    return res.status(400).json({ success: false, message: 'milkmanId and amount are required' })

  const milkman = await Milkman.findById(milkmanId)
  if (!milkman)
    return res.status(404).json({ success: false, message: 'Milkman not found' })

  // Create order in Razorpay (amount in paise — multiply ₹ by 100)
  const rzpOrder = await razorpay.orders.create({
    amount:   Math.round(amount * 100),
    currency: 'INR',
    receipt:  `milknet_${Date.now()}`,
    notes: {
      customerId:  req.user._id.toString(),
      milkmanId:   milkmanId,
      description: description || 'MilkNet Payment',
    },
  })

  // Save a pending payment record in DB
  const payment = await Payment.create({
    customer:         req.user._id,
    milkman:          milkmanId,
    razorpayOrderId:  rzpOrder.id,
    amount,
    description,
    type,
    month,
    status: 'created',
  })

  res.json({
    success: true,
    orderId:   rzpOrder.id,
    amount:    rzpOrder.amount,       // in paise
    currency:  rzpOrder.currency,
    paymentId: payment._id,
    keyId:     process.env.RAZORPAY_KEY_ID,
  })
})

// ── POST /api/payments/verify ─────────────────────────────────────────────────
// Step 2: Verify Razorpay signature after payment success on frontend
const verifyPayment = asyncHandler(async (req, res) => {
  const { razorpayOrderId, razorpayPaymentId, razorpaySignature, method } = req.body

  // Verify HMAC signature
  const expectedSig = crypto
    .createHmac('sha256', process.env.RAZORPAY_KEY_SECRET)
    .update(`${razorpayOrderId}|${razorpayPaymentId}`)
    .digest('hex')

  if (expectedSig !== razorpaySignature)
    return res.status(400).json({ success: false, message: 'Payment verification failed — invalid signature' })

  // Mark payment as paid in DB
  const payment = await Payment.findOneAndUpdate(
    { razorpayOrderId },
    {
      razorpayPaymentId,
      razorpaySignature,
      status: 'paid',
      method: method || 'other',
      paidAt: new Date(),
    },
    { new: true }
  ).populate('milkman', 'name area')

  if (!payment)
    return res.status(404).json({ success: false, message: 'Payment record not found' })

  res.json({
    success: true,
    message: 'Payment verified successfully',
    payment,
    txnId:  razorpayPaymentId,
  })
})

// ── GET /api/payments/my ──────────────────────────────────────────────────────
// Get all payments for the logged-in customer
const getMyPayments = asyncHandler(async (req, res) => {
  const { page = 1, limit = 10 } = req.query
  const skip  = (Number(page) - 1) * Number(limit)
  const total = await Payment.countDocuments({ customer: req.user._id })

  const payments = await Payment.find({ customer: req.user._id })
    .populate('milkman', 'name area initials color')
    .sort({ createdAt: -1 })
    .skip(skip)
    .limit(Number(limit))

  res.json({ success: true, count: payments.length, total, payments })
})

// ── GET /api/payments/milkman ─────────────────────────────────────────────────
// Get all payments received by the logged-in milkman
const getMilkmanPayments = asyncHandler(async (req, res) => {
  const milkman = await Milkman.findOne({ user: req.user._id })
  if (!milkman)
    return res.status(404).json({ success: false, message: 'Milkman profile not found' })

  const payments = await Payment.find({ milkman: milkman._id, status: 'paid' })
    .populate('customer', 'name email phone')
    .sort({ createdAt: -1 })

  const total = payments.reduce((sum, p) => sum + p.amount, 0)

  res.json({ success: true, count: payments.length, totalEarned: total, payments })
})

// ── GET /api/payments/summary ─────────────────────────────────────────────────
// Customer monthly summary for charts
const getMySummary = asyncHandler(async (req, res) => {
  const sixMonthsAgo = new Date()
  sixMonthsAgo.setMonth(sixMonthsAgo.getMonth() - 6)

  const summary = await Payment.aggregate([
    {
      $match: {
        customer: req.user._id,
        status:   'paid',
        paidAt:   { $gte: sixMonthsAgo },
      },
    },
    {
      $group: {
        _id:    { $dateToString: { format: '%Y-%m', date: '$paidAt' } },
        total:  { $sum: '$amount' },
        count:  { $sum: 1 },
      },
    },
    { $sort: { _id: 1 } },
  ])

  const totalSpent = await Payment.aggregate([
    { $match: { customer: req.user._id, status: 'paid' } },
    { $group: { _id: null, total: { $sum: '$amount' } } },
  ])

  res.json({
    success: true,
    monthlyData: summary.map(s => ({
      month:  s._id,
      amount: s.total,
      count:  s.count,
    })),
    totalSpent: totalSpent[0]?.total || 0,
  })
})

module.exports = { createOrder, verifyPayment, getMyPayments, getMilkmanPayments, getMySummary }

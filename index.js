const express  = require('express')
const mongoose = require('mongoose')
const cors     = require('cors')
const helmet   = require('helmet')
const morgan   = require('morgan')
require('dotenv').config()

const authRoutes         = require('./routes/authRoutes')
const milkmanRoutes      = require('./routes/milkmanRoutes')
const paymentRoutes      = require('./routes/paymentRoutes')
const uploadRoutes       = require('./routes/uploadRoutes')
const reviewRoutes       = require('./routes/reviewRoutes')
const subscriptionRoutes = require('./routes/subscriptionRoutes')

const app  = express()
const PORT = process.env.PORT || 5000

// ── Middleware ──
app.use(helmet())
app.use(morgan(process.env.NODE_ENV === 'production' ? 'combined' : 'dev'))
app.use(cors({ origin: process.env.CLIENT_URL || 'http://localhost:3000', credentials: true }))
app.use(express.json({ limit: '10mb' }))
app.use(express.urlencoded({ extended: true, limit: '10mb' }))

// ── Routes ──
app.use('/api/auth',          authRoutes)
app.use('/api/milkmen',       milkmanRoutes)
app.use('/api/payments',      paymentRoutes)
app.use('/api/upload',        uploadRoutes)
app.use('/api/reviews',       reviewRoutes)
app.use('/api/subscriptions', subscriptionRoutes)

// ── Health check ──
app.get('/api/health', (req, res) => {
  res.json({
    status: 'OK', server: 'MilkNet API',
    time:   new Date().toISOString(),
    db:     mongoose.connection.readyState === 1 ? 'connected' : 'disconnected',
  })
})

// ── 404 ──
app.use((req, res) => {
  res.status(404).json({ success: false, message: `Route ${req.originalUrl} not found` })
})

// ── Global error handler ──
app.use((err, req, res, next) => {
  console.error('Error:', err.stack)
  res.status(err.status || 500).json({
    success: false,
    message: err.message || 'Internal Server Error',
    ...(process.env.NODE_ENV === 'development' && { stack: err.stack }),
  })
})

// ── Start ──
mongoose.connect(process.env.MONGO_URI)
  .then(() => {
    console.log('MongoDB connected')
    app.listen(PORT, () => console.log(`MilkNet server running on http://localhost:${PORT}`))
  })
  .catch(err => { console.error('MongoDB failed:', err.message); process.exit(1) })

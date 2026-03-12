const mongoose = require('mongoose')

const documentSchema = new mongoose.Schema({
  name:    { type: String, required: true },   // "Aadhaar Card"
  s3Key:   { type: String, required: true },   // "milkmen/RK-aadhaar.pdf"
  s3Url:   { type: String, required: true },   // full HTTPS URL
  fileSize:{ type: String },
  uploadedAt: { type: Date, default: Date.now },
})

const reviewSummarySchema = new mongoose.Schema({
  totalRating:  { type: Number, default: 0 },
  reviewCount:  { type: Number, default: 0 },
  averageRating:{ type: Number, default: 0 },
}, { _id: false })

const milkmanSchema = new mongoose.Schema({
  // Link to the User account
  user:    { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true, unique: true },

  // Basic info
  name:         { type: String, required: true },
  area:         { type: String, required: true },
  phone:        { type: String },
  about:        { type: String, maxlength: 500 },
  experience:   { type: String, default: '0 years' },
  joinedYear:   { type: String, default: String(new Date().getFullYear()) },
  initials:     { type: String },
  color:        { type: String, default: '#E8A838' },  // UI avatar color

  // Delivery info
  price:        { type: Number, required: true, min: 0 },  // per litre in ₹
  deliveryTime: { type: String, default: '6:00 AM – 7:00 AM' },
  milkType:     [{ type: String }],
  schedule:     [{ type: String, enum: ['Mon','Tue','Wed','Thu','Fri','Sat','Sun'] }],

  // Status
  available:    { type: Boolean, default: true },
  isVerified:   { type: Boolean, default: false },
  badge:        { type: String, default: null },  // "Top Rated", "Verified", etc.

  // Stats
  customerCount:{ type: Number, default: 0 },
  reviewSummary: reviewSummarySchema,

  // AWS S3 documents
  documents:    [documentSchema],

}, { timestamps: true })

// Auto-calculate initials from name
milkmanSchema.pre('save', function (next) {
  if (this.isModified('name')) {
    const parts = this.name.trim().split(' ')
    this.initials = parts.length >= 2
      ? parts[0][0].toUpperCase() + parts[1][0].toUpperCase()
      : parts[0].slice(0, 2).toUpperCase()
  }
  next()
})

module.exports = mongoose.model('Milkman', milkmanSchema)

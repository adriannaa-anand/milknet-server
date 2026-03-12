const { PutObjectCommand, GetObjectCommand, DeleteObjectCommand } = require('@aws-sdk/client-s3')
const { getSignedUrl } = require('@aws-sdk/s3-request-presigner')
const s3       = require('../config/s3')
const Milkman  = require('../models/Milkman')
const asyncHandler = require('../middleware/errorHandler')
const { v4: uuid } = require('crypto')

const BUCKET = process.env.AWS_S3_BUCKET || 'milknet-docs'
const REGION = process.env.AWS_REGION    || 'ap-south-1'

// ── POST /api/upload/presign ──────────────────────────────────────────────────
// Returns a presigned PUT URL — frontend uploads directly to S3 (no server bandwidth used)
const getPresignedUrl = asyncHandler(async (req, res) => {
  const { fileName, fileType, folder = 'uploads' } = req.body

  if (!fileName || !fileType)
    return res.status(400).json({ success: false, message: 'fileName and fileType required' })

  // Allowed types
  const allowed = ['image/jpeg', 'image/png', 'image/webp', 'application/pdf']
  if (!allowed.includes(fileType))
    return res.status(400).json({ success: false, message: 'File type not allowed. Use JPG, PNG, WebP, or PDF.' })

  // Build unique S3 key
  const ext    = fileName.split('.').pop()
  const s3Key  = `${folder}/${req.user._id}-${Date.now()}.${ext}`

  const command = new PutObjectCommand({
    Bucket:      BUCKET,
    Key:         s3Key,
    ContentType: fileType,
  })

  // Presigned URL valid for 5 minutes
  const presignedUrl = await getSignedUrl(s3, command, { expiresIn: 300 })
  const fileUrl      = `https://${BUCKET}.s3.${REGION}.amazonaws.com/${s3Key}`

  res.json({ success: true, presignedUrl, fileUrl, s3Key })
})

// ── POST /api/upload/confirm ──────────────────────────────────────────────────
// Called after frontend finishes uploading — saves doc reference to milkman profile
const confirmUpload = asyncHandler(async (req, res) => {
  const { s3Key, fileUrl, fileName, fileSize, docName } = req.body

  if (req.user.role !== 'milkman')
    return res.status(403).json({ success: false, message: 'Only milkmen can upload documents' })

  const milkman = await Milkman.findOneAndUpdate(
    { user: req.user._id },
    {
      $push: {
        documents: {
          name:     docName || fileName,
          s3Key,
          s3Url:    fileUrl,
          fileSize: fileSize || 'Unknown',
        },
      },
    },
    { new: true }
  )

  if (!milkman)
    return res.status(404).json({ success: false, message: 'Milkman profile not found' })

  res.json({ success: true, message: 'Document saved', documents: milkman.documents })
})

// ── DELETE /api/upload/document/:docId ────────────────────────────────────────
const deleteDocument = asyncHandler(async (req, res) => {
  const milkman = await Milkman.findOne({ user: req.user._id })
  if (!milkman)
    return res.status(404).json({ success: false, message: 'Milkman profile not found' })

  const doc = milkman.documents.id(req.params.docId)
  if (!doc)
    return res.status(404).json({ success: false, message: 'Document not found' })

  // Delete from S3
  await s3.send(new DeleteObjectCommand({ Bucket: BUCKET, Key: doc.s3Key }))

  // Remove from DB
  doc.deleteOne()
  await milkman.save()

  res.json({ success: true, message: 'Document deleted' })
})

// ── GET /api/upload/signed-url/:s3Key — generate temporary read URL ───────────
const getReadUrl = asyncHandler(async (req, res) => {
  const s3Key  = decodeURIComponent(req.params.s3Key)
  const command = new GetObjectCommand({ Bucket: BUCKET, Key: s3Key })
  const url     = await getSignedUrl(s3, command, { expiresIn: 3600 }) // 1 hour

  res.json({ success: true, url })
})

module.exports = { getPresignedUrl, confirmUpload, deleteDocument, getReadUrl }

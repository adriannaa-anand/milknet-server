const express = require('express')
const router  = express.Router()

const { getPresignedUrl, confirmUpload, deleteDocument, getReadUrl } = require('../controllers/uploadController')
const { protect, requireRole } = require('../middleware/authMiddleware')

router.post('/presign',              protect, getPresignedUrl)
router.post('/confirm',              protect, requireRole('milkman'), confirmUpload)
router.delete('/document/:docId',    protect, requireRole('milkman'), deleteDocument)
router.get('/signed-url/:s3Key(*)',   protect, getReadUrl)

module.exports = router

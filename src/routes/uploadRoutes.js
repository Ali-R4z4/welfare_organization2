// backend/src/routes/uploadRoutes.js - FIXED VERSION

const express = require('express');
const router = express.Router();
const {
  uploadImage,
  uploadMultipleImages,
  deleteImage
} = require('../controllers/uploadController');
const { protect } = require('../middleware/authMiddleware');
const upload = require('../middleware/uploadMiddleware');

// Protected routes (Admin only)
router.post('/image', protect, upload.single('image'), uploadImage);
router.post('/images', protect, upload.array('images', 10), uploadMultipleImages);

// DELETE route - using query parameter (NO wildcard *)
router.delete('/image', protect, deleteImage); // CHANGED: removed "/*"

module.exports = router;
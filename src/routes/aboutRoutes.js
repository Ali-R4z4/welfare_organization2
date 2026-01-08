const express = require('express');
const router = express.Router();
const { getAboutUs, updateAboutUs } = require('../controllers/aboutController');
const { protect, admin } = require('../middleware/authMiddleware');

// Public route - anyone can view
router.get('/', getAboutUs);

// Protected route - only admin can update
router.put('/', protect, admin, updateAboutUs);

module.exports = router;
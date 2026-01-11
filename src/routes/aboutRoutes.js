const express = require('express');
const router = express.Router();
const { getAboutUs, updateAboutUs } = require('../controllers/aboutController');

// Public route - anyone can view
router.get('/', getAboutUs);

// For now, make update public too (we'll add auth later)
router.put('/', updateAboutUs);

module.exports = router;
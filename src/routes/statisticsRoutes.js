// backend/src/routes/statisticsRoutes.js

const express = require('express');
const router = express.Router();
const {
  getDashboardStats,
  getProjectStats,
  getDonationStats,
  getDonorStats
} = require('../controllers/statisticsController');

const { protect, adminOnly } = require('../middleware/authMiddleware');

// Public routes
router.get('/projects', getProjectStats);

// Protected routes (Admin only)
router.get('/dashboard', protect, adminOnly, getDashboardStats);
router.get('/donations', protect, adminOnly, getDonationStats);
router.get('/donors', protect, adminOnly, getDonorStats);

module.exports = router;
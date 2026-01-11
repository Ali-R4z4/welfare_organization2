// backend/src/routes/donationRoutes.js
const express = require('express');
const router = express.Router();
const {
  createDonation,
  getAllDonations,
  getDonation,
  verifyDonation,
  deleteDonation,
  getDonationStats,
  getDonationSettings,
  updateDonationSettings
} = require('../controllers/donationController');
const { protect, adminOnly } = require('../middleware/authMiddleware');

// ========== PUBLIC ROUTES ==========
// Get donation settings (for donation page)
router.get('/settings', getDonationSettings);

// Get specific donation (for status checking)
router.get('/:id', getDonation);

// Create new donation
router.post('/', createDonation);

// ========== PROTECTED ADMIN ROUTES ==========
// Get all donations with filters
router.get('/', protect, adminOnly, getAllDonations);

// Get donation statistics
router.get('/statistics/summary', protect, adminOnly, getDonationStats);

// Update donation settings
router.put('/settings', protect, adminOnly, updateDonationSettings);

// Verify/update donation status
router.put('/:id/verify', protect, adminOnly, verifyDonation);

// Delete donation
router.delete('/:id', protect, adminOnly, deleteDonation);

module.exports = router;
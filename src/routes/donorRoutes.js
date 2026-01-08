const express = require('express');
const router = express.Router();

const {
  registerDonor,
  loginDonor,
  getDonorProfile,
  updateDonorProfile,
  getAllDonors,
  getDonor
} = require('../controllers/donorController');

const { protect, protectDonor } = require('../middleware/authMiddleware');

// Public routes
router.post('/register', registerDonor);
router.post('/login', loginDonor);

// Protected routes (Donor only)
router.get('/profile', protectDonor, getDonorProfile);
router.put('/profile', protectDonor, updateDonorProfile);

// Protected routes (Admin only)
router.get('/', protect, getAllDonors);
router.get('/:id', protect, getDonor);

module.exports = router;
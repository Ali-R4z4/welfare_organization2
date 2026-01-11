const express = require('express');
const router = express.Router();

const {
  createDonation,
  getAllDonations,
  getDonation,
  getMyDonations,
  getProjectDonations,
  updateDonation,
  deleteDonation
} = require('../controllers/donationController');

const { protect, protectDonor } = require('../middleware/authMiddleware');

// Public routes
router.post('/', createDonation);
router.get('/project/:id', getProjectDonations);

// Protected routes (Donor)
router.get('/my', protectDonor, getMyDonations);

// Protected routes (Admin)
router.get('/', protect, getAllDonations);
router.get('/:id', protect, getDonation);
router.put('/:id', protect, updateDonation);
router.delete('/:id', protect, deleteDonation);

module.exports = router;
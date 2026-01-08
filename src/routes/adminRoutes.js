const express = require('express');
const router = express.Router();
const adminController = require('../controllers/adminController');
const { protect } = require('../middleware/authMiddleware');

// Debug: Log what we imported (remove this after fixing)
console.log('Available admin controller functions:', Object.keys(adminController));

// Public routes
router.post('/register', adminController.registerAdmin);
router.post('/login', adminController.loginAdmin);

// Protected routes
router.get('/profile', protect, adminController.getAdminProfile);
router.put('/reset-password', protect, adminController.resetPassword);
router.put('/profile', protect, adminController.updateAdminProfile);

module.exports = router;
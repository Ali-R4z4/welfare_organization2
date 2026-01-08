// backend/src/routes/contactRoutes.js
const express = require('express');
const router = express.Router();
const contactController = require('../controllers/contactController');
const { protect, adminOnly } = require('../middleware/authMiddleware');

// Public routes
router.get('/settings', contactController.getContactSettings);
router.post('/submit', contactController.submitContactForm);

// Admin routes
router.put('/settings', protect, adminOnly, contactController.updateContactSettings);
router.get('/messages', protect, adminOnly, contactController.getContactMessages);
router.put('/messages/:id', protect, adminOnly, contactController.updateMessageStatus);
router.delete('/messages/:id', protect, adminOnly, contactController.deleteContactMessage);

module.exports = router;
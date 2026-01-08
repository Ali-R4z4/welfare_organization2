// backend/src/controllers/contactController.js
const ContactSettings = require('../models/ContactSettings');
const ContactMessage = require('../models/ContactMessage');

// @desc    Get contact settings (Public)
// @route   GET /api/contact/settings
// @access  Public
exports.getContactSettings = async (req, res) => {
  try {
    const settings = await ContactSettings.getSettings();
    
    res.status(200).json({
      success: true,
      data: settings
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Failed to fetch contact settings',
      error: error.message
    });
  }
};

// @desc    Update contact settings (Admin only)
// @route   PUT /api/contact/settings
// @access  Private/Admin
exports.updateContactSettings = async (req, res) => {
  try {
    let settings = await ContactSettings.findOne();
    
    if (!settings) {
      settings = await ContactSettings.create(req.body);
    } else {
      settings = await ContactSettings.findOneAndUpdate(
        {},
        req.body,
        { new: true, runValidators: true }
      );
    }

    res.status(200).json({
      success: true,
      message: 'Contact settings updated successfully',
      data: settings
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Failed to update contact settings',
      error: error.message
    });
  }
};

// @desc    Submit contact form (Public)
// @route   POST /api/contact/submit
// @access  Public
exports.submitContactForm = async (req, res) => {
  try {
    const { name, email, phone, subject, message } = req.body;

    // Check if contact form is enabled
    const settings = await ContactSettings.getSettings();
    if (!settings.contactFormEnabled) {
      return res.status(403).json({
        success: false,
        message: 'Contact form is currently disabled'
      });
    }

    // Create message
    const contactMessage = await ContactMessage.create({
      name,
      email,
      phone,
      subject,
      message,
      ipAddress: req.ip,
      userAgent: req.get('user-agent')
    });

    // TODO: Send email notification to admin
    // TODO: Send auto-reply email if enabled

    res.status(201).json({
      success: true,
      message: 'Your message has been sent successfully. We will get back to you soon!',
      data: contactMessage
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Failed to submit contact form',
      error: error.message
    });
  }
};

// @desc    Get all contact messages (Admin only)
// @route   GET /api/contact/messages
// @access  Private/Admin
exports.getContactMessages = async (req, res) => {
  try {
    const { status, page = 1, limit = 20 } = req.query;

    const query = status ? { status } : {};

    const messages = await ContactMessage.find(query)
      .sort({ createdAt: -1 })
      .limit(limit * 1)
      .skip((page - 1) * limit);

    const total = await ContactMessage.countDocuments(query);

    res.status(200).json({
      success: true,
      data: messages,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total,
        pages: Math.ceil(total / limit)
      }
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Failed to fetch contact messages',
      error: error.message
    });
  }
};

// @desc    Update message status (Admin only)
// @route   PUT /api/contact/messages/:id
// @access  Private/Admin
exports.updateMessageStatus = async (req, res) => {
  try {
    const { status } = req.body;

    const message = await ContactMessage.findByIdAndUpdate(
      req.params.id,
      { status },
      { new: true, runValidators: true }
    );

    if (!message) {
      return res.status(404).json({
        success: false,
        message: 'Message not found'
      });
    }

    res.status(200).json({
      success: true,
      message: 'Message status updated',
      data: message
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Failed to update message status',
      error: error.message
    });
  }
};

// @desc    Delete contact message (Admin only)
// @route   DELETE /api/contact/messages/:id
// @access  Private/Admin
exports.deleteContactMessage = async (req, res) => {
  try {
    const message = await ContactMessage.findByIdAndDelete(req.params.id);

    if (!message) {
      return res.status(404).json({
        success: false,
        message: 'Message not found'
      });
    }

    res.status(200).json({
      success: true,
      message: 'Message deleted successfully'
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Failed to delete message',
      error: error.message
    });
  }
};
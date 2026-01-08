// backend/src/models/ContactSettings.js
const mongoose = require('mongoose');

const contactSettingsSchema = new mongoose.Schema({
  // Office Information
  organizationName: {
    type: String,
    required: true,
    default: 'Pakistan Medico International'
  },
  
  addresses: [{
    label: String,        // e.g., "Head Office", "Branch Office"
    street: String,
    city: String,
    state: String,
    postalCode: String,
    country: String,
    isPrimary: {
      type: Boolean,
      default: false
    }
  }],

  phones: [{
    label: String,        // e.g., "Main Office", "WhatsApp", "Emergency"
    number: String,
    isPrimary: {
      type: Boolean,
      default: false
    }
  }],

  emails: [{
    label: String,        // e.g., "General Inquiries", "Support", "Donations"
    address: String,
    isPrimary: {
      type: Boolean,
      default: false
    }
  }],

  // Working Hours
  workingHours: {
    weekdays: {
      type: String,
      default: 'Monday - Friday: 9:00 AM - 6:00 PM'
    },
    weekends: {
      type: String,
      default: 'Saturday: 10:00 AM - 4:00 PM'
    },
    holidays: {
      type: String,
      default: 'Sunday: Closed'
    }
  },

  // Social Media
  socialMedia: {
    facebook: String,
    twitter: String,
    instagram: String,
    linkedin: String,
    youtube: String
  },

  // Map Settings
  mapSettings: {
    embedUrl: String,     // Google Maps embed URL
    latitude: Number,
    longitude: Number
  },

  // Contact Form Settings
  contactFormEnabled: {
    type: Boolean,
    default: true
  },

  autoReplyEnabled: {
    type: Boolean,
    default: true
  },

  autoReplyMessage: {
    type: String,
    default: 'Thank you for contacting us. We will get back to you within 24 hours.'
  },

  // Notification Settings
  notificationEmail: {
    type: String,
    default: 'admin@welfare.org'
  }

}, {
  timestamps: true
});

// Ensure only one settings document exists
contactSettingsSchema.statics.getSettings = async function() {
  let settings = await this.findOne();
  if (!settings) {
    settings = await this.create({});
  }
  return settings;
};

module.exports = mongoose.model('ContactSettings', contactSettingsSchema);
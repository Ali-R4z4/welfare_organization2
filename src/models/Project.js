// backend/src/models/Project.js
const mongoose = require('mongoose');

const projectSchema = new mongoose.Schema(
  {
    title: {
      type: String,
      required: [true, 'Project title is required'],
      trim: true,
      maxlength: [100, 'Title cannot exceed 100 characters']
    },
    description: {
      type: String,
      required: [true, 'Project description is required'],
      trim: true
    },
    location: {
      type: String,
      required: [true, 'Project location is required'],
      trim: true
    },
    // CHANGED: image to images (array)
    images: [{
      type: String,
      required: [true, 'At least one project image is required']
    }],
    // NEW: category field
    category: {
      type: String,
      required: [true, 'Project category is required'],
      enum: ['healthcare', 'education', 'emergency', 'food', 'shelter', 'other'],
      default: 'healthcare'
    },
    // REMOVED: date field (we'll use startDate instead)
    startDate: {
      type: Date,
      default: Date.now
    },
    endDate: {
      type: Date
    },
    status: {
      type: String,
      enum: ['active', 'completed', 'upcoming'],
      default: 'active'
    },
    beneficiaries: {
      type: Number,
      default: 0
    },
    // Optional: You can keep or remove these donation fields
    targetAmount: {
      type: Number,
      default: 0,
      min: [0, 'Target amount cannot be negative']
    },
    raisedAmount: {
      type: Number,
      default: 0,
      min: [0, 'Raised amount cannot be negative']
    },
    donationCount: {
      type: Number,
      default: 0
    }
  },
  {
    timestamps: true
  }
);

// Virtual field to calculate percentage raised
projectSchema.virtual('percentageRaised').get(function() {
  if (this.targetAmount === 0) return 0;
  return Math.round((this.raisedAmount / this.targetAmount) * 100);
});

// Ensure virtuals are included in JSON
projectSchema.set('toJSON', { virtuals: true });
projectSchema.set('toObject', { virtuals: true });

module.exports = mongoose.models.Project || mongoose.model('Project', projectSchema);
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
    image: {
      type: String,
      required: [true, 'Project image is required']
    },
    date: {
      type: Date,
      required: [true, 'Project date is required']
    },
    status: {
      type: String,
      enum: ['ongoing', 'completed', 'upcoming'],
      default: 'ongoing'
    },
    beneficiaries: {
      type: Number,
      default: 0
    },
    // NEW FIELDS FOR DONATIONS
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
    currency: {
      type: String,
      enum: ['USD', 'PKR', 'EUR', 'GBP'],
      default: 'PKR'
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

// FIX: Check if model exists before creating
module.exports = mongoose.models.Project || mongoose.model('Project', projectSchema);
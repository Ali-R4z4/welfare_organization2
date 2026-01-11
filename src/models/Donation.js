const mongoose = require('mongoose');

const donationSchema = new mongoose.Schema(
  {
    donor: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Donor',
      required: [true, 'Donor is required']
    },
    project: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Project',
      required: [true, 'Project is required']
    },
    amount: {
      type: Number,
      required: [true, 'Donation amount is required'],
      min: [1, 'Donation amount must be at least 1']
    },
    currency: {
      type: String,
      enum: ['USD', 'PKR', 'EUR', 'GBP'],
      default: 'PKR'
    },
    paymentMethod: {
      type: String,
      enum: ['card', 'bank_transfer', 'cash', 'other'],
      default: 'card'
    },
    paymentStatus: {
      type: String,
      enum: ['pending', 'completed', 'failed', 'refunded'],
      default: 'pending'
    },
    stripePaymentId: {
      type: String,
      default: null
    },
    receiptNumber: {
      type: String,
      unique: true,
      sparse: true // Allows multiple null values
    },
    message: {
      type: String,
      trim: true,
      maxlength: [500, 'Message cannot exceed 500 characters']
    },
    isAnonymous: {
      type: Boolean,
      default: false
    },
    donorName: {
      type: String,
      trim: true
    },
    donorEmail: {
      type: String,
      trim: true
    }
  },
  {
    timestamps: true
  }
);

// Generate unique receipt number before saving
donationSchema.pre('save', async function() {
  if (!this.receiptNumber && this.paymentStatus === 'completed') {
    const timestamp = Date.now();
    const random = Math.floor(Math.random() * 1000).toString().padStart(3, '0');
    this.receiptNumber = `RCP-${timestamp}-${random}`;
  }
});

// Index for faster queries
donationSchema.index({ donor: 1, createdAt: -1 });
donationSchema.index({ project: 1, createdAt: -1 });
donationSchema.index({ paymentStatus: 1 });

module.exports = mongoose.model('Donation', donationSchema);
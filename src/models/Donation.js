const mongoose = require('mongoose');

const donationSchema = new mongoose.Schema(
  {
    donor: {
      name: {
        type: String,
        required: [true, 'Donor name is required'],
        trim: true
      },
      email: {
        type: String,
        required: [true, 'Email is required'],
        trim: true,
        lowercase: true,
        match: [/^\S+@\S+\.\S+$/, 'Please provide a valid email']
      },
      phone: {
        type: String,
        trim: true
      },
      address: {
        type: String,
        trim: true
      },
      country: {
        type: String,
        trim: true
      }
    },
    project: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Project',
      required: false
    },
    amount: {
      type: Number,
      required: [true, 'Amount is required'],
      min: [1, 'Amount must be at least 1']
    },
    currency: {
      type: String,
      required: [true, 'Currency is required'],
      enum: ['PKR', 'USD', 'EUR', 'GBP', 'AED', 'SAR'],
      default: 'PKR'
    },
    // For currency conversion
    convertedAmount: {
      type: Number // Amount in PKR after conversion
    },
    exchangeRate: {
      type: Number // Rate used for conversion
    },
    
    // Payment method
    paymentMethod: {
      type: String,
      enum: ['bank_transfer', 'credit_card', 'debit_card', 'jazzcash', 'easypaisa', 'paypal'],
      default: 'bank_transfer'
    },
    
    // Payment gateway info (for card payments)
    paymentGateway: {
      type: String,
      enum: ['stripe', 'paypal', 'razorpay', 'manual'],
      default: 'manual'
    },
    gatewayTransactionId: String,
    gatewayStatus: String,
    
    status: {
      type: String,
      enum: ['pending', 'processing', 'completed', 'failed', 'cancelled', 'refunded'],
      default: 'pending'
    },
    
    // Bank transfer details
    bankName: {
      type: String,
      default: 'Meezan Bank Limited'
    },
    bankAccountNumber: String,
    bankAccountTitle: {
      type: String,
      default: 'Pakistan Medico International'
    },
    bankSwiftCode: {
      type: String,
      default: 'MEZNPKKA'
    },
    bankIBAN: String,
    bankBranch: String,
    bankReference: String,
    bankTransferDate: Date,
    bankTransferSlip: String, // Image URL
    
    // Location tracking
    ipAddress: String,
    location: {
      ip: String,
      country: String,
      countryCode: String,
      city: String,
      region: String,
      timezone: String,
      latitude: Number,
      longitude: Number
    },
    userAgent: String,
    
    // Privacy policy
    privacyPolicyAccepted: {
      type: Boolean,
      required: [true, 'Privacy policy must be accepted'],
      default: false
    },
    privacyPolicyAcceptedAt: Date,
    termsAccepted: {
      type: Boolean,
      default: false
    },
    
    // Admin verification
    verifiedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Admin'
    },
    verifiedAt: Date,
    
    // Card payment details (for future integration)
    cardLast4: String,
    cardBrand: String,
    
    notes: {
      type: String,
      trim: true
    },
    
    // Email notifications
    receiptSent: {
      type: Boolean,
      default: false
    },
    receiptSentAt: Date
  },
  {
    timestamps: true
  }
);

// Indexes
donationSchema.index({ 'donor.email': 1 });
donationSchema.index({ status: 1 });
donationSchema.index({ createdAt: -1 });
donationSchema.index({ currency: 1 });
donationSchema.index({ 'donor.country': 1 });

// Virtual for formatted amount
donationSchema.virtual('formattedAmount').get(function() {
  const symbols = {
    'PKR': '₨',
    'USD': '$',
    'EUR': '€',
    'GBP': '£'
  };
  return `${symbols[this.currency] || this.currency} ${this.amount.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
});

// Virtual for bank details summary
donationSchema.virtual('bankSummary').get(function() {
  if (this.bankAccountNumber) {
    return `${this.bankName} - A/C ${this.bankAccountNumber.slice(-4)}`;
  }
  return this.bankName;
});

donationSchema.set('toJSON', { virtuals: true });
donationSchema.set('toObject', { virtuals: true });

// Pre-save to calculate converted amount (using static rates for now)
donationSchema.pre('save', async function() {
  if (this.isModified('amount') || this.isModified('currency') || this.isNew) {
    const rates = {
      'PKR': 1,
      'USD': 280, // 1 USD = 280 PKR (example rate)
      'EUR': 300, // 1 EUR = 300 PKR
      'GBP': 350, // 1 GBP = 350 PKR
      'AED': 76,  // 1 AED = 76 PKR
      'SAR': 75   // 1 SAR = 75 PKR
    };
    
    if (this.currency && this.currency !== 'PKR' && rates[this.currency]) {
      this.exchangeRate = rates[this.currency];
      this.convertedAmount = this.amount * this.exchangeRate;
    } else {
      this.convertedAmount = this.amount || 0;
      this.exchangeRate = 1;
    }
  }
  
  if (this.isModified('privacyPolicyAccepted') && this.privacyPolicyAccepted) {
    this.privacyPolicyAcceptedAt = new Date();
  }
});

module.exports = mongoose.model('Donation', donationSchema);
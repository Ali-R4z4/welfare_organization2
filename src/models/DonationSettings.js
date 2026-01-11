const mongoose = require('mongoose');

const donationSettingsSchema = new mongoose.Schema(
  {
    // Bank details images (TWO IMAGES)
    bankDetailsImage: {
      type: String,
      default: ''
    },
    bankDetailsImage2: {
      type: String,
      default: ''
    },
    
    // Bank information (text)
    bankName: {
      type: String,
      default: 'Meezan Bank Limited'
    },
    accountNumber: {
      type: String,
      default: ''
    },
    accountTitle: {
      type: String,
      default: 'Pakistan Medico International'
    },
    iban: {
      type: String,
      default: ''
    },
    swiftCode: {
      type: String,
      default: 'MEZNPKKA'
    },
    branchCode: {
      type: String,
      default: ''
    },
    branchAddress: {
      type: String,
      default: ''
    },
    
    // International bank details
    internationalBankName: String,
    internationalAccountNumber: String,
    internationalSwiftCode: String,
    internationalRoutingNumber: String,
    
    // Payment instructions
    paymentInstructions: {
      type: String,
      default: 'Please mention "Donation" in the transaction description. After payment, email the transfer receipt to donations@pmiofficial.com'
    },
    
    // Privacy policy TEXT (not image)
    privacyPolicyText: {
      type: String,
      default: 'Your donation information will be kept confidential and used only for donation processing and receipt purposes.'
    },
    
    // Currency options
    acceptedCurrencies: [{
      type: String,
      enum: ['PKR', 'USD', 'EUR', 'GBP', 'AED', 'SAR']
    }],
    defaultCurrency: {
      type: String,
      enum: ['PKR', 'USD', 'EUR', 'GBP', 'AED', 'SAR'],
      default: 'PKR'
    },
    
    // Exchange rates (for display)
    exchangeRates: {
      USD: { type: Number, default: 280 },
      EUR: { type: Number, default: 300 },
      GBP: { type: Number, default: 350 },
      AED: { type: Number, default: 76 },
      SAR: { type: Number, default: 75 }
    },
    
    // Payment methods
    enabledPaymentMethods: [{
      type: String,
      enum: ['bank_transfer', 'credit_card', 'debit_card', 'jazzcash', 'easypaisa']
    }],
    
    // Email templates
    donationReceiptEmail: {
      subject: String,
      body: String
    },
    
    // Contact information
    contactEmail: {
      type: String,
      default: 'donations@pmiofficial.com'
    },
    contactPhone: {
      type: String,
      default: '+92 333 2107502'
    },
    
    // Notification settings
    notifyOnDonation: {
      type: Boolean,
      default: true
    },
    notificationEmails: [String],
    
    updatedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Admin'
    }
  },
  {
    timestamps: true
  }
);

// Create or update settings
donationSettingsSchema.statics.getSettings = async function() {
  let settings = await this.findOne();
  if (!settings) {
    settings = await this.create({
      acceptedCurrencies: ['PKR', 'USD', 'EUR', 'GBP'],
      enabledPaymentMethods: ['bank_transfer'],
      exchangeRates: {
        USD: 280,
        EUR: 300,
        GBP: 350
      }
    });
  }
  return settings;
};

module.exports = mongoose.model('DonationSettings', donationSettingsSchema);
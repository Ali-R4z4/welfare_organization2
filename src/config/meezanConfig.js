// backend/src/config/meezanConfig.js
// ===========================================
// MEEZAN BANK PAYMENT GATEWAY CONFIGURATION
// ===========================================
// Client will add their credentials here

module.exports = {
  // Merchant credentials (provided by Meezan Bank)
  merchantId: process.env.MEEZAN_MERCHANT_ID || '', // e.g., '123456'
  hashKey: process.env.MEEZAN_HASH_KEY || '', // Secret key for transaction signing
  
  // Gateway URLs
  testUrl: process.env.MEEZAN_TEST_URL || 'https://test.mpg.meezanbank.com/PaymentGW',
  liveUrl: process.env.MEEZAN_LIVE_URL || 'https://mpg.meezanbank.com/PaymentGW',
  
  // Environment (test or live)
  environment: process.env.MEEZAN_ENVIRONMENT || 'test', // 'test' or 'live'
  
  // Return URLs (where Meezan redirects after payment)
  returnUrl: process.env.MEEZAN_RETURN_URL || 'http://localhost:3000/donation/callback',
  cancelUrl: process.env.MEEZAN_CANCEL_URL || 'http://localhost:3000/donation/cancel',
  
  // Payment settings
  currency: 'PKR',
  hashAlgorithm: 'SHA256', // Usually HMAC SHA256
  
  // Helper function to check if credentials are configured
  isConfigured() {
    return !!(this.merchantId && this.hashKey);
  },
  
  // Get active gateway URL
  getGatewayUrl() {
    return this.environment === 'live' ? this.liveUrl : this.testUrl;
  }
};
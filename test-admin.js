require('dotenv').config();
const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

// Connect to MongoDB
mongoose.connect(process.env.MONGO_URI)
  .then(() => console.log('MongoDB Connected'))
  .catch(err => console.error('Connection Error:', err));

// Define schema inline
const adminSchema = new mongoose.Schema({
  name: String,
  email: String,
  password: String,
  role: { type: String, default: 'admin' },
  isActive: { type: Boolean, default: true }
}, { timestamps: true });

// Add pre-save hook - FIXED VERSION (no next parameter)
adminSchema.pre('save', async function() {
  if (!this.isModified('password')) {
    return;
  }
  
  const salt = await bcrypt.genSalt(10);
  this.password = await bcrypt.hash(this.password, salt);
});

const TestAdmin = mongoose.model('TestAdmin', adminSchema);

// Test function
async function testCreate() {
  try {
    console.log('Creating test admin...');
    
    const admin = await TestAdmin.create({
      name: 'Test User',
      email: 'test' + Date.now() + '@test.com', // Unique email each time
      password: 'password123'
    });
    
    console.log('✅ Success! Admin created:', admin);
    process.exit(0);
  } catch (error) {
    console.error('❌ Error:', error.message);
    console.error('Stack:', error.stack);
    process.exit(1);
  }
}

// Run test after connection
setTimeout(testCreate, 2000);
const express = require('express');
const cors = require('cors');

// Import routes
const projectRoutes = require('./routes/projectRoutes');
const adminRoutes = require('./routes/adminRoutes');
const donorRoutes = require('./routes/donorRoutes');
const donationRoutes = require('./routes/donationRoutes');
const uploadRoutes = require('./routes/uploadRoutes');
const statisticsRoutes = require('./routes/statisticsRoutes');
const contactRoutes = require('./routes/contactRoutes');

const app = express();

// CORS Configuration
const corsOptions = {
  origin: [
    'http://localhost:5173',
    'http://localhost:3000',
    'https://*.vercel.app',
    'https://vercel.app'
  ],
  credentials: true,
  optionsSuccessStatus: 200
};

// Middleware
app.use(cors(corsOptions));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Test route
app.get('/', (req, res) => {
  res.json({
    message: 'Welfare Organization API',
    status: 'running',
    version: '1.0.0'
  });
});

// API Routes
app.use('/api/projects', projectRoutes);
app.use('/api/admin', adminRoutes);
app.use('/api/donors', donorRoutes);
app.use('/api/donations', donationRoutes);
app.use('/api/upload', uploadRoutes);
app.use('/api/statistics', statisticsRoutes);
app.use('/api/contact', contactRoutes);

// Health check route
app.get('/health', (req, res) => {
  res.json({
    status: 'OK',
    timestamp: new Date(),
    uptime: process.uptime()
  });
});

// 404 handler
app.use((req, res) => {
  res.status(404).json({
    success: false,
    message: 'Route not found'
  });
});

module.exports = app;
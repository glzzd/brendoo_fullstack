const express = require('express');
const http = require('http');
const cors = require('cors');
const helmet = require('helmet');
const rateLimit = require('express-rate-limit');
require('dotenv').config();

const connectDB = require('./src/config/database');
const socketManager = require('./src/config/socket');
const errorHandler = require('./src/middleware/errorHandler');
const bulkFetchWorker = require('./src/workers/bulkFetchWorker');
const authRoutes = require('./src/routes/authRoutes');
const userRoutes = require('./src/routes/userRoutes');
const storeRoutes = require('./src/routes/storeRoutes');
const gosportRoutes = require('./src/routes/gosportRoutes');
const bulkFetchRoutes = require('./src/routes/bulkFetchRoutes');

const app = express();
const server = http.createServer(app);
const PORT = process.env.PORT || 3001;

// Connect to MongoDB
connectDB();

// Security middleware
app.use(helmet());
app.use(cors({
  origin: ['http://localhost:5001', 'http://localhost:3001'],
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization']
}));

// Rate limiting - DISABLED for development
// const limiter = rateLimit({
//   windowMs: 15 * 60 * 1000, // 15 minutes
//   max: process.env.NODE_ENV === 'production' ? 100 : 1000, // Higher limit for development
//   message: 'Too many requests from this IP, please try again later.'
// });
// app.use(limiter);

// Body parsing middleware
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true }));

// Routes
app.use('/api/auth', authRoutes);
app.use('/api/users', userRoutes);
app.use('/api/stores', storeRoutes);
app.use('/api/gosport', gosportRoutes);
app.use('/api/bulk-fetch', bulkFetchRoutes);

// Health check endpoint
app.get('/api/health', (req, res) => {
  res.status(200).json({
    success: true,
    message: 'Server is running successfully',
    timestamp: new Date().toISOString()
  });
});

// 404 handler
app.use('*', (req, res) => {
  res.status(404).json({
    success: false,
    message: 'Route not found'
  });
});

// Error handling middleware (should be last)
app.use(errorHandler);

server.listen(PORT, async () => {
  console.log(`Server running on port ${PORT}`);
  
  // Initialize Socket.IO
  socketManager.initialize(server);
  
  // Start bulk fetch worker
  try {
    await bulkFetchWorker.start();
    console.log('🚀 Bulk fetch worker started successfully');
  } catch (error) {
    console.error('❌ Failed to start bulk fetch worker:', error);
  }
});

module.exports = app;
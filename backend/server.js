const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const path = require('path');
const config = require('./config/config');
const { sequelize, testConnection } = require('./config/database');
const routes = require('./routes');
const { generalLimiter } = require('./middleware/rateLimiter');

// Initialize express app
const app = express();

// Security middleware
app.use(helmet());

// CORS configuration
app.use(cors(config.cors));

// Body parser middleware
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// Rate limiting
app.use('/api/', generalLimiter);

// Serve static files (profile pictures, uploads)
app.use('/media', express.static(path.join(__dirname, 'media')));
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

// API Routes
app.use('/api', routes);

// Root endpoint
app.get('/', (req, res) => {
  res.json({
    success: true,
    message: 'Welcome to PawWell Care Center API',
    version: '1.0.0',
    documentation: '/api/health'
  });
});

// 404 handler
app.use((req, res) => {
  res.status(404).json({
    success: false,
    message: 'Endpoint not found',
    path: req.originalUrl
  });
});

// Global error handler
app.use((err, req, res, next) => {
  console.error('Error:', err);

  // Handle Sequelize errors
  if (err.name === 'SequelizeValidationError') {
    const errors = {};
    err.errors.forEach(error => {
      errors[error.path] = [error.message];
    });
    
    return res.status(400).json({
      success: false,
      message: 'Validation error',
      errors
    });
  }

  if (err.name === 'SequelizeUniqueConstraintError') {
    const errors = {};
    err.errors.forEach(error => {
      errors[error.path] = ['This value already exists'];
    });
    
    return res.status(400).json({
      success: false,
      message: 'Duplicate entry',
      errors
    });
  }

  // Default error response
  res.status(err.status || 500).json({
    success: false,
    message: err.message || 'Internal server error',
    ...(config.NODE_ENV === 'development' && { stack: err.stack })
  });
});

// Start server
const PORT = config.PORT;

const startServer = async () => {
  try {
    // Test database connection
    console.log('');
    console.log('═══════════════════════════════════════════════════════');
    console.log('🔍 Testing database connection...');
    console.log('═══════════════════════════════════════════════════════');
    const connected = await testConnection();

    if (!connected) {
      console.error('❌ Failed to connect to database. Exiting...');
      process.exit(1);
    }

    // Sync database models (create tables if they don't exist)
    console.log('');
    console.log('🔄 Syncing database models...');
    await sequelize.sync({ alter: false });  // Using alter:false for production safety
    console.log('✅ Database models synced successfully');
    console.log('📋 Tables: users, password_resets');

    // Start Express server
    app.listen(PORT, () => {
      console.log('');
      console.log('═══════════════════════════════════════════════════════');
      console.log('🐾 PawWell Care Center API Server');
      console.log('═══════════════════════════════════════════════════════');
      console.log(`🚀 Server running on port ${PORT}`);
      console.log(`🌍 Environment: ${config.NODE_ENV}`);
      console.log(`📍 Base URL: http://localhost:${PORT}`);
      console.log(`🔗 API Endpoints: http://localhost:${PORT}/api`);
      console.log(`❤️  Health Check: http://localhost:${PORT}/api/health`);
      console.log('═══════════════════════════════════════════════════════');
      console.log('');
    });
  } catch (error) {
    console.error('❌ Failed to start server:', error);
    process.exit(1);
  }
};

// Handle unhandled promise rejections
process.on('unhandledRejection', (err) => {
  console.error('Unhandled Promise Rejection:', err);
  // Close server & exit process
  process.exit(1);
});

// Handle uncaught exceptions
process.on('uncaughtException', (err) => {
  console.error('Uncaught Exception:', err);
  process.exit(1);
});

// Graceful shutdown
process.on('SIGTERM', async () => {
  console.log('SIGTERM received. Closing server gracefully...');
  await sequelize.close();
  process.exit(0);
});

process.on('SIGINT', async () => {
  console.log('SIGINT received. Closing server gracefully...');
  await sequelize.close();
  process.exit(0);
});

// Start the server
startServer();

module.exports = app;

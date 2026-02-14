const express = require('express');
const router = express.Router();
const authRoutes = require('./auth');
const adminRoutes = require('./admin');
const petRoutes = require('./pets');
const bookingRoutes = require('./bookings');
const activityLogRoutes = require('./activityLogs');
const contactRoutes = require('./contact');

// Mount auth routes
router.use('/accounts', authRoutes);

// Mount admin routes
router.use('/admin', adminRoutes);

// Mount pet routes
router.use('/pets', petRoutes);

// Mount booking routes
router.use('/bookings', bookingRoutes);

// Mount activity log routes
router.use('/activity-logs', activityLogRoutes);

// Mount contact routes
router.use('/contact', contactRoutes);

// Health check endpoint
router.get('/health', (req, res) => {
  res.status(200).json({
    success: true,
    message: 'PawWell Care Center API is running',
    timestamp: new Date().toISOString()
  });
});

module.exports = router;

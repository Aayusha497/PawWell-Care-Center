const express = require('express');
const router = express.Router();
const authRoutes = require('./auth');
const adminRoutes = require('./admin');
const petRoutes = require('./pets');
const bookingRoutes = require('./bookings');
const activityLogRoutes = require('./activityLogs');
const contactRoutes = require('./contact');
const emergencyRoutes = require('./emergency');
const wellnessTimelineRoutes = require('./wellnessTimeline');
const notificationRoutes = require('./notifications');
const reviewRoutes = require('./reviews');
const chatbotRoutes = require('./chatbot');
const settingsRoutes = require('./settings');

//  auth routes
router.use('/accounts', authRoutes);

//  admin routes
router.use('/admin', adminRoutes);

//  pet routes
router.use('/pets', petRoutes);

//  booking routes
router.use('/bookings', bookingRoutes);

//  activity log routes
router.use('/activity-logs', activityLogRoutes);

//  contact routes
router.use('/contact', contactRoutes);

//  emergency routes
router.use('/emergency', emergencyRoutes);

//  wellness timeline routes
router.use('/wellness-timeline', wellnessTimelineRoutes);

//  notification routes
router.use('/notifications', notificationRoutes);

//  review routes
router.use('/reviews', reviewRoutes);

//  chatbot routes
router.use('/chat', chatbotRoutes);

//  settings routes
router.use('/settings', settingsRoutes);

// Health check endpoint
router.get('/health', (req, res) => {
  res.status(200).json({
    success: true,
    message: 'PawWell Care Center API is running',
    timestamp: new Date().toISOString()
  });
});

module.exports = router;

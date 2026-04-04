const express = require('express');
const router = express.Router();
const { authenticate, requireAdmin } = require('../middleware/auth');
const adminController = require('../controllers/adminController');
const contactController = require('../controllers/contactController');
const analyticsController = require('../controllers/analyticsController');

/**
 * All routes require authentication and admin role
 */

/**
 * @route   GET /api/admin/users
 * @desc    Get all users
 * @access  Admin only
 */
router.get('/users', authenticate, requireAdmin, adminController.getAllUsers);

/**
 * @route   GET /api/admin/users/:userId
 * @desc    Get user by ID
 * @access  Admin only
 */
router.get('/users/:userId', authenticate, requireAdmin, adminController.getUserById);

/**
 * @route   PUT /api/admin/users/:userId
 * @desc    Update user
 * @access  Admin only
 */
router.put('/users/:userId', authenticate, requireAdmin, adminController.updateUser);

/**
 * @route   DELETE /api/admin/users/:userId
 * @desc    Delete/deactivate user
 * @access  Admin only
 */
router.delete('/users/:userId', authenticate, requireAdmin, adminController.deleteUser);

/**
 * @route   GET /api/admin/bookings
 * @desc    Get all bookings (system-wide)
 * @access  Admin only
 */
router.get('/bookings', authenticate, requireAdmin, adminController.getAllBookings);

/**
 * @route   GET /api/admin/stats
 * @desc    Get system statistics
 * @access  Admin only
 */
router.get('/stats', authenticate, requireAdmin, adminController.getSystemStats);

/**
 * @route   GET /api/admin/notifications/summary
 * @desc    Get notification summary counts
 * @access  Admin only
 */
router.get('/notifications/summary', authenticate, requireAdmin, adminController.getNotificationSummary);

/**
 * @route   GET /api/admin/contact-messages
 * @desc    Get contact messages
 * @access  Admin only
 */
router.get('/contact-messages', authenticate, requireAdmin, contactController.getContactMessages);

/**
 * @route   PUT /api/admin/contact-messages/mark-read
 * @desc    Mark all contact messages as read
 * @access  Admin only
 */
router.put('/contact-messages/mark-read', authenticate, requireAdmin, contactController.markAllContactMessagesRead);

/**
 * @route   PUT /api/admin/contact-messages/:contactId/read
 * @desc    Mark a contact message as read
 * @access  Admin only
 */
router.put('/contact-messages/:contactId/read', authenticate, requireAdmin, contactController.markContactMessageRead);

/**
 * @route   GET /api/admin/emergency-requests
 * @desc    Get emergency requests
 * @access  Admin only
 */
router.get('/emergency-requests', authenticate, requireAdmin, adminController.getEmergencyRequests);

// ====== PET MANAGEMENT ROUTES ======

/**
 * @route   GET /api/admin/pets
 * @desc    Get all pets with pagination and filtering
 * @access  Admin only
 */
router.get('/pets', authenticate, requireAdmin, adminController.getAllPets);

/**
 * @route   GET /api/admin/pets/:petId
 * @desc    Get pet by ID with owner details
 * @access  Admin only
 */
router.get('/pets/:petId', authenticate, requireAdmin, adminController.getPetById);

/**
 * @route   DELETE /api/admin/pets/:petId
 * @desc    Delete/soft delete pet
 * @access  Admin only
 */
router.delete('/pets/:petId', authenticate, requireAdmin, adminController.deletePet);

/**
 * @route   PUT /api/admin/config
 * @desc    Update system configuration
 * @access  Admin only
 */
router.put('/config', authenticate, requireAdmin, adminController.updateSystemConfig);

// ====== ANALYTICS ROUTES ======

/**
 * @route   GET /api/admin/analytics/dashboard
 * @desc    Get comprehensive dashboard analytics
 * @access  Admin only
 */
router.get('/analytics/dashboard', authenticate, requireAdmin, analyticsController.getDashboardAnalytics);

/**
 * @route   GET /api/admin/analytics/booking-trends
 * @desc    Get booking trends over time
 * @access  Admin only
 */
router.get('/analytics/booking-trends', authenticate, requireAdmin, analyticsController.getBookingTrends);

/**
 * @route   GET /api/admin/analytics/revenue-trends
 * @desc    Get revenue trends over time
 * @access  Admin only
 */
router.get('/analytics/revenue-trends', authenticate, requireAdmin, analyticsController.getRevenueTrends);

/**
 * @route   GET /api/admin/analytics/top-services
 * @desc    Get top services by booking count
 * @access  Admin only
 */
router.get('/analytics/top-services', authenticate, requireAdmin, analyticsController.getTopServices);

/**
 * @route   GET /api/admin/analytics/booking-status
 * @desc    Get booking status distribution
 * @access  Admin only
 */
router.get('/analytics/booking-status', authenticate, requireAdmin, analyticsController.getBookingStatusDistribution);

/**
 * @route   GET /api/admin/analytics/pet-types
 * @desc    Get pet types distribution
 * @access  Admin only
 */
router.get('/analytics/pet-types', authenticate, requireAdmin, analyticsController.getPetTypesDistribution);

/**
 * @route   GET /api/admin/analytics/peak-hours
 * @desc    Get peak hours and days for bookings
 * @access  Admin only
 */
router.get('/analytics/peak-hours', authenticate, requireAdmin, analyticsController.getPeakHours);

/**
 * @route   GET /api/admin/analytics/recent-bookings
 * @desc    Get recent bookings
 * @access  Admin only
 */
router.get('/analytics/recent-bookings', authenticate, requireAdmin, analyticsController.getRecentBookings);

/**
 * @route   GET /api/admin/analytics/recent-payments
 * @desc    Get recent payments
 * @access  Admin only
 */
router.get('/analytics/recent-payments', authenticate, requireAdmin, analyticsController.getRecentPayments);

/**
 * @route   GET /api/admin/analytics/alerts
 * @desc    Get system alerts
 * @access  Admin only
 */
router.get('/analytics/alerts', authenticate, requireAdmin, analyticsController.getAlerts);

/**
 * @route   GET /api/admin/analytics/service-types
 * @desc    Get all available service types
 * @access  Admin only
 */
router.get('/analytics/service-types', authenticate, requireAdmin, analyticsController.getAvailableServiceTypes);

module.exports = router;

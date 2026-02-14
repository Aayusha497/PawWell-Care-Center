const express = require('express');
const router = express.Router();
const { authenticate, requireAdmin } = require('../middleware/auth');
const adminController = require('../controllers/adminController');
const contactController = require('../controllers/contactController');

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

/**
 * @route   PUT /api/admin/config
 * @desc    Update system configuration
 * @access  Admin only
 */
router.put('/config', authenticate, requireAdmin, adminController.updateSystemConfig);

module.exports = router;

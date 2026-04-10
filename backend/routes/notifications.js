const express = require('express');
const router = express.Router();
const { authenticate } = require('../middleware/auth');
const {
  getUserNotifications,
  markNotificationAsRead,
  markAllNotificationsAsRead,
  markNotificationsByTypeAsRead,
  deleteNotification
} = require('../controllers/notificationController');

// All routes require authentication
router.use(authenticate);

// @route   GET /api/notifications
// @desc    Get all notifications for logged-in user
// @access  Private
router.get('/', getUserNotifications);

// @route   PATCH /api/notifications/mark-all-read
// @desc    Mark all notifications as read
// @access  Private
router.patch('/mark-all-read', markAllNotificationsAsRead);

// @route   PATCH /api/notifications/mark-type-read/:type
// @desc    Mark all notifications of a specific type as read
// @access  Private
router.patch('/mark-type-read/:type', markNotificationsByTypeAsRead);

//  @route   PATCH /api/notifications/:id/read
// @desc    Mark a notification as read
// @access  Private
router.patch('/:id/read', markNotificationAsRead);

// @route   DELETE /api/notifications/:id
// @desc    Delete a notification
// @access  Private
router.delete('/:id', deleteNotification);

module.exports = router;

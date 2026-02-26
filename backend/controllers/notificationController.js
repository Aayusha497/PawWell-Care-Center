const { Notification } = require('../models');
const { Op } = require('sequelize');

/**
 * @route   GET /api/notifications
 * @desc    Get all notifications for logged-in user
 * @access  Private
 */
const getUserNotifications = async (req, res) => {
  try {
    const userId = req.user.id;
    
    const notifications = await Notification.findAll({
      where: { user_id: userId },
      order: [['created_at', 'DESC']],
      limit: 50 // Last 50 notifications
    });

    const unreadCount = await Notification.count({
      where: {
        user_id: userId,
        is_read: false
      }
    });

    return res.status(200).json({
      success: true,
      data: {
        notifications,
        unreadCount
      }
    });
  } catch (error) {
    console.error('❌ Error fetching notifications:', error);
    return res.status(500).json({
      success: false,
      message: 'Failed to fetch notifications',
      error: error.message
    });
  }
};

/**
 * @route   PATCH /api/notifications/:id/read
 * @desc    Mark a notification as read
 * @access  Private
 */
const markNotificationAsRead = async (req, res) => {
  try {
    const { id } = req.params;
    const userId = req.user.id;

    const notification = await Notification.findOne({
      where: {
        notification_id: id,
        user_id: userId
      }
    });

    if (!notification) {
      return res.status(404).json({
        success: false,
        message: 'Notification not found'
      });
    }

    notification.is_read = true;
    await notification.save();

    return res.status(200).json({
      success: true,
      message: 'Notification marked as read',
      data: notification
    });
  } catch (error) {
    console.error('❌ Error marking notification as read:', error);
    return res.status(500).json({
      success: false,
      message: 'Failed to mark notification as read',
      error: error.message
    });
  }
};

/**
 * @route   PATCH /api/notifications/mark-all-read
 * @desc    Mark all notifications as read for logged-in user  
 * @access  Private
 */
const markAllNotificationsAsRead = async (req, res) => {
  try {
    const userId = req.user.id;

    await Notification.update(
      { is_read: true },
      {
        where: {
          user_id: userId,
          is_read: false
        }
      }
    );

    return res.status(200).json({
      success: true,
      message: 'All notifications marked as read'
    });
  } catch (error) {
    console.error('❌ Error marking all notifications as read:', error);
    return res.status(500).json({
      success: false,
      message: 'Failed to mark all notifications as read',
      error: error.message
    });
  }
};

/**
 * @route   DELETE /api/notifications/:id
 * @desc    Delete a notification
 * @access  Private
 */
const deleteNotification = async (req, res) => {
  try {
    const { id } = req.params;
    const userId = req.user.id;

    const notification = await Notification.findOne({
      where: {
        notification_id: id,
        user_id: userId
      }
    });

    if (!notification) {
      return res.status(404).json({
        success: false,
        message: 'Notification not found'
      });
    }

    await notification.destroy();

    return res.status(200).json({
      success: true,
      message: 'Notification deleted'
    });
  } catch (error) {
    console.error('❌ Error deleting notification:', error);
    return res.status(500).json({
      success: false,
      message: 'Failed to delete notification',
      error: error.message
    });
  }
};

/**
 * Helper function to create a notification
 * @param {number} userId - User ID to send notification to
 * @param {string} type - Notification type
 * @param {string} title - Notification title
 * @param {string} message - Notification message
 * @param {string} referenceType - Type of reference (booking, pet, emergency, activity)
 * @param {number} referenceId - ID of the referenced entity
 */
const createNotification = async (userId, type, title, message, referenceType = null, referenceId = null) => {
  try {
    const notification = await Notification.create({
      user_id: userId,
      type,
      title,
      message,
      reference_type: referenceType,
      reference_id: referenceId,
      is_read: false
    });

    console.log(`✅ Notification created for user ${userId}:`, title);
    return notification;
  } catch (error) {
    console.error('❌ Error creating notification:', error);
    throw error;
  }
};

module.exports = {
  getUserNotifications,
  markNotificationAsRead,
  markAllNotificationsAsRead,
  deleteNotification,
  createNotification
};

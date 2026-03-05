const { UserSettings, User } = require('../models');
const { Op } = require('sequelize');

/**
 * Get user settings
 * @route GET /api/settings
 */
exports.getSettings = async (req, res) => {
  try {
    const userId = req.user.id;

    let settings = await UserSettings.findOne({
      where: { userId }
    });

    // If no settings exist, create default settings
    if (!settings) {
      settings = await UserSettings.create({
        userId,
        theme: 'light',
        emailNotifications: true,
        smsNotifications: false,
        activityUpdates: true,
        bookingReminders: true
      });
    }

    return res.status(200).json({
      success: true,
      data: {
        theme: settings.theme,
        emailNotifications: settings.emailNotifications,
        smsNotifications: settings.smsNotifications,
        activityUpdates: settings.activityUpdates,
        bookingReminders: settings.bookingReminders
      }
    });
  } catch (error) {
    console.error('Error fetching user settings:', error);
    return res.status(500).json({
      success: false,
      message: 'Failed to fetch settings',
      error: error.message
    });
  }
};

/**
 * Update user settings
 * @route PUT /api/settings
 */
exports.updateSettings = async (req, res) => {
  try {
    const userId = req.user.id;
    const { 
      theme, 
      emailNotifications, 
      smsNotifications, 
      activityUpdates, 
      bookingReminders 
    } = req.body;

    // Validate theme value
    if (theme && !['light', 'dark'].includes(theme)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid theme value. Must be "light" or "dark"'
      });
    }

    let settings = await UserSettings.findOne({
      where: { userId }
    });

    if (!settings) {
      // Create new settings if they don't exist
      settings = await UserSettings.create({
        userId,
        theme: theme || 'light',
        emailNotifications: emailNotifications !== undefined ? emailNotifications : true,
        smsNotifications: smsNotifications !== undefined ? smsNotifications : false,
        activityUpdates: activityUpdates !== undefined ? activityUpdates : true,
        bookingReminders: bookingReminders !== undefined ? bookingReminders : true
      });
    } else {
      // Update existing settings
      const updateData = {};
      
      if (theme !== undefined) updateData.theme = theme;
      if (emailNotifications !== undefined) updateData.emailNotifications = emailNotifications;
      if (smsNotifications !== undefined) updateData.smsNotifications = smsNotifications;
      if (activityUpdates !== undefined) updateData.activityUpdates = activityUpdates;
      if (bookingReminders !== undefined) updateData.bookingReminders = bookingReminders;

      await settings.update(updateData);
    }

    return res.status(200).json({
      success: true,
      message: 'Settings updated successfully',
      data: {
        theme: settings.theme,
        emailNotifications: settings.emailNotifications,
        smsNotifications: settings.smsNotifications,
        activityUpdates: settings.activityUpdates,
        bookingReminders: settings.bookingReminders
      }
    });
  } catch (error) {
    console.error('Error updating user settings:', error);
    return res.status(500).json({
      success: false,
      message: 'Failed to update settings',
      error: error.message
    });
  }
};

/**
 * Reset settings to default
 * @route POST /api/settings/reset
 */
exports.resetSettings = async (req, res) => {
  try {
    const userId = req.user.id;

    const [settings] = await UserSettings.upsert({
      userId,
      theme: 'light',
      emailNotifications: true,
      smsNotifications: false,
      activityUpdates: true,
      bookingReminders: true
    });

    return res.status(200).json({
      success: true,
      message: 'Settings reset to defaults successfully',
      data: {
        theme: settings.theme,
        emailNotifications: settings.emailNotifications,
        smsNotifications: settings.smsNotifications,
        activityUpdates: settings.activityUpdates,
        bookingReminders: settings.bookingReminders
      }
    });
  } catch (error) {
    console.error('Error resetting user settings:', error);
    return res.status(500).json({
      success: false,
      message: 'Failed to reset settings',
      error: error.message
    });
  }
};

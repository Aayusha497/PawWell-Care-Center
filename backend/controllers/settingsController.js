const { UserSettings, User } = require('../models');
const { Op } = require('sequelize');
const bcrypt = require('bcrypt');

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

/**
 * Change user password
 * @route PUT /api/settings/password
 */
exports.changePassword = async (req, res) => {
  try {
    const userId = req.user.id;
    const { currentPassword, newPassword } = req.body;

    // Validate input
    if (!currentPassword || !newPassword) {
      return res.status(400).json({
        success: false,
        message: 'Current password and new password are required'
      });
    }

    // Validate new password strength
    if (newPassword.length < 8) {
      return res.status(400).json({
        success: false,
        message: 'New password must be at least 8 characters long'
      });
    }

    // Get user
    const user = await User.findByPk(userId);
    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }

    // Verify current password
    const isPasswordValid = await bcrypt.compare(currentPassword, user.password);
    if (!isPasswordValid) {
      return res.status(401).json({
        success: false,
        message: 'Current password is incorrect'
      });
    }

    // Check if new password is same as current
    const isSamePassword = await bcrypt.compare(newPassword, user.password);
    if (isSamePassword) {
      return res.status(400).json({
        success: false,
        message: 'New password must be different from current password'
      });
    }

    // Hash and update new password
    const hashedPassword = await bcrypt.hash(newPassword, 10);
    user.password = hashedPassword;
    await user.save();

    console.log(`🔒 Password changed successfully for user ${user.email}`);

    return res.status(200).json({
      success: true,
      message: 'Password changed successfully'
    });
  } catch (error) {
    console.error('Error changing password:', error);
    return res.status(500).json({
      success: false,
      message: 'Failed to change password',
      error: error.message
    });
  }
};

/**
 * Change user email
 * @route PUT /api/settings/email
 */
exports.changeEmail = async (req, res) => {
  try {
    const userId = req.user.id;
    const { newEmail } = req.body;

    // Validate input
    if (!newEmail) {
      return res.status(400).json({
        success: false,
        message: 'New email is required'
      });
    }

    // Validate email format
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(newEmail)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid email format'
      });
    }

    const normalizedEmail = newEmail.toLowerCase().trim();

    // Get user
    const user = await User.findByPk(userId);
    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }

    // Check if email is same as current
    if (normalizedEmail === user.email.toLowerCase()) {
      return res.status(400).json({
        success: false,
        message: 'New email must be different from current email'
      });
    }

    // Check if new email is already in use
    const existingUser = await User.findOne({
      where: { email: normalizedEmail }
    });

    if (existingUser) {
      return res.status(409).json({
        success: false,
        message: 'This email is already in use'
      });
    }

    // Update email
    user.email = normalizedEmail;
    await user.save();

    console.log(`📧 Email changed successfully for user ${userId}: ${user.email}`);

    return res.status(200).json({
      success: true,
      message: 'Email changed successfully',
      data: {
        email: user.email
      }
    });
  } catch (error) {
    console.error('Error changing email:', error);
    return res.status(500).json({
      success: false,
      message: 'Failed to change email',
      error: error.message
    });
  }
};

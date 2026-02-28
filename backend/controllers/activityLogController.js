/**
 * Activity Log Controller
 * 
 * Handles pet activity timeline operations (feeding, walks, grooming, etc.)
 */

const { ActivityLog, Pet, User, Notification } = require('../models');
const { deleteImage } = require('../config/cloudinary');
const { sendEmail } = require('../utils/emailService');
const { Op } = require('sequelize');

/**
 * Create a new activity log entry
 * POST /api/activity-logs
 */
const createActivityLog = async (req, res) => {
  try {
    const userId = req.user.id;
    const userType = req.user.userType;
    const { pet_id, activity_type, description, notify_owner } = req.body;

    // Validate role - only admin/staff can create activity logs
    if (userType !== 'admin' && userType !== 'staff') {
      return res.status(403).json({
        success: false,
        message: 'Only admin and staff can create activity logs',
      });
    }

    // Validate required fields
    if (!pet_id || !activity_type) {
      return res.status(400).json({
        success: false,
        message: 'Pet and activity type are required',
      });
    }

    // Check if pet exists
    const pet = await Pet.findByPk(pet_id);
    if (!pet) {
      return res.status(404).json({
        success: false,
        message: 'Pet not found',
      });
    }

    // Get photo URL if uploaded
    const photoUrl = req.file ? req.file.path : null;

    // Get activity title based on type
    const activityTitles = {
      'feeding': 'Feeding',
      'walk': 'Walk',
      'playtime': 'Playtime',
      'medication': 'Medication',
      'grooming': 'Grooming',
      'training': 'Training',
      'veterinary': 'Veterinary Visit',
      'other': 'Other Activity'
    };

    // Create activity log
    const activityLog = await ActivityLog.create({
      pet_id: parseInt(pet_id),
      user_id: userId,
      activity_type: activity_type,
      timestamp: new Date(),
      detail: description?.trim() || null,
      photo: photoUrl,
      notify_owner: notify_owner === 'true' || notify_owner === true,
    });

    // If notify_owner is true, create notification for pet owner
    if (notify_owner === 'true' || notify_owner === true) {
      const notificationTitle = `Pet Activity Update`;
      const notificationMessage = `New ${activityTitles[activity_type] || activity_type} activity logged for ${pet.name}`;
      
      await Notification.create({
        user_id: pet.user_id,
        type: 'pet_updated',
        title: notificationTitle,
        message: notificationMessage,
        reference_type: 'activity',
        reference_id: activityLog.activity_id,
        is_read: false,
      });

      // Optionally send email notification
      try {
        const owner = await User.findByPk(pet.user_id);
        if (owner && owner.email) {
          await sendEmail({
            to: owner.email,
            subject: `Pet Activity Update: ${pet.name}`,
            html: `
              <h2>New Activity for ${pet.name}</h2>
              <p><strong>Activity Type:</strong> ${activityTitles[activity_type] || activity_type}</p>
              ${description ? `<p><strong>Details:</strong> ${description}</p>` : ''}
              <p>Log in to view more details.</p>
            `,
          });
        }
      } catch (emailError) {
        console.error('Error sending notification email:', emailError);
        // Don't fail the request if email fails
      }
    }

    // Fetch the created log with associations
    const createdLog = await ActivityLog.findByPk(activityLog.activity_id, {
      include: [
        {
          model: Pet,
          as: 'pet',
          attributes: ['pet_id', 'name', 'breed', 'photo'],
        },
        {
          model: User,
          as: 'user',
          attributes: ['id', 'first_name', 'last_name'],
        },
      ],
    });

    res.status(201).json({
      success: true,
      message: 'Activity log created successfully',
      data: createdLog,
    });
  } catch (error) {
    console.error('Error creating activity log:', error);
    
    // Delete uploaded image if creation fails
    if (req.file) {
      try {
        await deleteImage(req.file.path);
      } catch (deleteError) {
        console.error('Error deleting uploaded image:', deleteError);
      }
    }

    res.status(500).json({
      success: false,
      message: 'Failed to create activity log',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined,
    });
  }
};

/**
 * Get activity logs with filters
 * GET /api/activity-logs
 */
const getActivityLogs = async (req, res) => {
  try {
    const userId = req.user.id;
    const userType = req.user.userType;
    const { pet_id, date, activity_type } = req.query;

    // Build where clause based on user type
    let whereClause = {};
    
    // Pet owners can only see logs for their pets
    if (userType === 'pet_owner') {
      const userPets = await Pet.findAll({
        where: { user_id: userId },
        attributes: ['pet_id'],
      });
      const petIds = userPets.map(p => p.pet_id);
      
      if (petIds.length === 0) {
        return res.status(200).json({
          success: true,
          count: 0,
          data: [],
        });
      }
      
      whereClause.pet_id = { [Op.in]: petIds };
    }
    
    // Apply filters
    if (pet_id) {
      whereClause.pet_id = parseInt(pet_id);
    }
    
    if (activity_type) {
      whereClause.activity_type = activity_type;
    }
    
    if (date) {
      const startOfDay = new Date(date);
      startOfDay.setHours(0, 0, 0, 0);
      const endOfDay = new Date(date);
      endOfDay.setHours(23, 59, 59, 999);
      
      whereClause.timestamp = {
        [Op.between]: [startOfDay, endOfDay],
      };
    }

    const activityLogs = await ActivityLog.findAll({
      where: whereClause,
      include: [
        {
          model: Pet,
          as: 'pet',
          attributes: ['pet_id', 'name', 'breed', 'photo', 'user_id'],
        },
        {
          model: User,
          as: 'user',
          attributes: ['id', 'first_name', 'last_name', 'user_type'],
        },
      ],
      order: [['timestamp', 'DESC'], ['created_at', 'DESC']],
    });

    // Check notification status for each log
    const logsWithNotificationStatus = await Promise.all(
      activityLogs.map(async (log) => {
        const logData = log.toJSON();
        if (log.notify_owner) {
          const notification = await Notification.findOne({
            where: { 
              reference_type: 'activity',
              reference_id: log.activity_id 
            },
          });
          logData.notified = !!notification;
        } else {
          logData.notified = false;
        }
        return logData;
      })
    );

    res.status(200).json({
      success: true,
      count: logsWithNotificationStatus.length,
      data: logsWithNotificationStatus,
    });
  } catch (error) {
    console.error('Error fetching activity logs:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch activity logs',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined,
    });
  }
};

/**
 * Get a specific activity log by ID
 * GET /api/activity-logs/:id
 */
const getActivityLogById = async (req, res) => {
  try {
    const userId = req.user.id;
    const userType = req.user.userType;
    const logId = parseInt(req.params.id);

    const activityLog = await ActivityLog.findByPk(logId, {
      include: [
        {
          model: Pet,
          as: 'pet',
          attributes: ['pet_id', 'name', 'breed', 'photo', 'user_id'],
        },
        {
          model: User,
          as: 'user',
          attributes: ['id', 'first_name', 'last_name', 'user_type'],
        },
      ],
    });

    if (!activityLog) {
      return res.status(404).json({
        success: false,
        message: 'Activity log not found',
      });
    }

    // Check permissions
    if (userType === 'pet_owner' && activityLog.pet.user_id !== userId) {
      return res.status(403).json({
        success: false,
        message: 'You do not have permission to view this activity log',
      });
    }

    const logData = activityLog.toJSON();
    if (activityLog.notify_owner) {
      const notification = await Notification.findOne({
        where: { 
          reference_type: 'activity',
          reference_id: activityLog.activity_id 
        },
      });
      logData.notified = !!notification;
    } else {
      logData.notified = false;
    }

    res.status(200).json({
      success: true,
      data: logData,
    });
  } catch (error) {
    console.error('Error fetching activity log:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch activity log',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined,
    });
  }
};

/**
 * Update an activity log
 * PUT /api/activity-logs/:id
 */
const updateActivityLog = async (req, res) => {
  try {
    const userId = req.user.id;
    const userType = req.user.userType;
    const logId = parseInt(req.params.id);
    const { activity_type, description, notify_owner } = req.body;

    // Only admin/staff can update activity logs
    if (userType !== 'admin' && userType !== 'staff') {
      return res.status(403).json({
        success: false,
        message: 'Only admin and staff can update activity logs',
      });
    }

    const activityLog = await ActivityLog.findByPk(logId);

    if (!activityLog) {
      return res.status(404).json({
        success: false,
        message: 'Activity log not found',
      });
    }

    // Only creator or admin can update
    if (userType === 'staff' && activityLog.user_id !== userId) {
      return res.status(403).json({
        success: false,
        message: 'You can only update your own activity logs',
      });
    }

    // Get activity title based on type
    const activityTitles = {
      'feeding': 'Feeding',
      'walk': 'Walk',
      'playtime': 'Playtime',
      'medication': 'Medication',
      'grooming': 'Grooming',
      'training': 'Training',
      'veterinary': 'Veterinary Visit',
      'other': 'Other Activity'
    };

    // Update fields
    const updateData = {};
    
    if (activity_type) {
      updateData.activity_type = activity_type;
    }
    
    if (description !== undefined) {
      updateData.detail = description.trim() || null;
    }
    
    if (notify_owner !== undefined) {
      updateData.notify_owner = notify_owner === 'true' || notify_owner === true;
    }

    // Handle photo update
    if (req.file) {
      // Delete old photo if exists
      if (activityLog.photo) {
        try {
          await deleteImage(activityLog.photo);
        } catch (deleteError) {
          console.error('Error deleting old photo:', deleteError);
        }
      }
      updateData.photo = req.file.path;
    }

    await activityLog.update(updateData);

    // Fetch updated log with associations
    const updatedLog = await ActivityLog.findByPk(logId, {
      include: [
        {
          model: Pet,
          as: 'pet',
          attributes: ['pet_id', 'name', 'breed', 'photo'],
        },
        {
          model: User,
          as: 'user',
          attributes: ['id', 'first_name', 'last_name'],
        },
      ],
    });

    res.status(200).json({
      success: true,
      message: 'Activity log updated successfully',
      data: updatedLog,
    });
  } catch (error) {
    console.error('Error updating activity log:', error);
    
    // Delete uploaded image if update fails
    if (req.file) {
      try {
        await deleteImage(req.file.path);
      } catch (deleteError) {
        console.error('Error deleting uploaded image:', deleteError);
      }
    }

    res.status(500).json({
      success: false,
      message: 'Failed to update activity log',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined,
    });
  }
};

/**
 * Delete an activity log
 * DELETE /api/activity-logs/:id
 */
const deleteActivityLog = async (req, res) => {
  try {
    const userId = req.user.id;
    const userType = req.user.userType;
    const logId = parseInt(req.params.id);

    // Only admin/staff can delete activity logs
    if (userType !== 'admin' && userType !== 'staff') {
      return res.status(403).json({
        success: false,
        message: 'Only admin and staff can delete activity logs',
      });
    }

    const activityLog = await ActivityLog.findByPk(logId);

    if (!activityLog) {
      return res.status(404).json({
        success: false,
        message: 'Activity log not found',
      });
    }

    // Only creator or admin can delete
    if (userType === 'staff' && activityLog.user_id !== userId) {
      return res.status(403).json({
        success: false,
        message: 'You can only delete your own activity logs',
      });
    }

    // Delete photo if exists
    if (activityLog.photo) {
      try {
        await deleteImage(activityLog.photo);
      } catch (deleteError) {
        console.error('Error deleting photo:', deleteError);
      }
    }

    // Delete related notifications
    await Notification.destroy({
      where: { 
        reference_type: 'activity',
        reference_id: logId 
      },
    });

    await activityLog.destroy();

    res.status(200).json({
      success: true,
      message: 'Activity log deleted successfully',
    });
  } catch (error) {
    console.error('Error deleting activity log:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to delete activity log',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined,
    });
  }
};

/**
 * Get all activity logs (Admin endpoint)
 * GET /api/activity-logs/admin/all
 */
const getAllActivityLogs = async (req, res) => {
  try {
    console.log('getAllActivityLogs called, user:', req.user?.id, 'userType:', req.user?.userType);
    
    const userType = req.user.userType;
    const { pet_id, activity_type } = req.query;

    // Only admin/staff can access all logs
    if (userType !== 'admin' && userType !== 'staff') {
      console.log('User not admin/staff, userType:', userType);
      return res.status(403).json({
        success: false,
        message: 'Only admin and staff can view all activity logs',
      });
    }

    // Build where clause based on filters
    const whereClause = {};
    
    if (pet_id) {
      whereClause.pet_id = parseInt(pet_id);
    }
    
    if (activity_type) {
      whereClause.activity_type = activity_type;
    }

    console.log('Fetching activity logs with whereClause:', whereClause);

    const activityLogs = await ActivityLog.findAll({
      where: whereClause,
      include: [
        {
          model: Pet,
          as: 'pet',
          attributes: ['pet_id', 'name', 'breed', 'photo', 'user_id'],
          required: false,
        },
        {
          model: User,
          as: 'user',
          attributes: ['id', 'first_name', 'last_name', 'user_type'],
          required: false,
        },
      ],
      order: [['timestamp', 'DESC']],
    });

    console.log('Found activity logs:', activityLogs.length);

    res.status(200).json({
      success: true,
      count: activityLogs.length,
      data: activityLogs,
    });
  } catch (error) {
    console.error('Error fetching all activity logs:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch activity logs',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined,
    });
  }
};

module.exports = {
  createActivityLog,
  getActivityLogs,
  getActivityLogById,
  updateActivityLog,
  deleteActivityLog,
  getAllActivityLogs,
};

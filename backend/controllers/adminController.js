const { User } = require('../models');
const { Op } = require('sequelize');

/**
 * @desc    Get all users in the system
 * @route   GET /api/admin/users
 * @access  Admin only
 */
const getAllUsers = async (req, res) => {
  try {
    const { page = 1, limit = 20, search, userType } = req.query;
    const offset = (page - 1) * limit;

    // Build query conditions
    const whereClause = {};
    
    if (search) {
      whereClause[Op.or] = [
        { email: { [Op.iLike]: `%${search}%` } },
        { firstName: { [Op.iLike]: `%${search}%` } },
        { lastName: { [Op.iLike]: `%${search}%` } }
      ];
    }

    if (userType) {
      whereClause.userType = userType;
    }

    const { count, rows: users } = await User.findAndCountAll({
      where: whereClause,
      attributes: { exclude: ['password'] },
      limit: parseInt(limit),
      offset: parseInt(offset),
      order: [['createdAt', 'DESC']]
    });

    return res.status(200).json({
      success: true,
      data: users,
      pagination: {
        total: count,
        page: parseInt(page),
        limit: parseInt(limit),
        pages: Math.ceil(count / limit)
      }
    });
  } catch (error) {
    console.error('Get all users error:', error);
    return res.status(500).json({
      success: false,
      message: 'Failed to fetch users',
      error: error.message
    });
  }
};

/**
 * @desc    Get user by ID
 * @route   GET /api/admin/users/:userId
 * @access  Admin only
 */
const getUserById = async (req, res) => {
  try {
    const { userId } = req.params;

    const user = await User.findByPk(userId, {
      attributes: { exclude: ['password'] }
    });

    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }

    return res.status(200).json({
      success: true,
      data: user
    });
  } catch (error) {
    console.error('Get user by ID error:', error);
    return res.status(500).json({
      success: false,
      message: 'Failed to fetch user',
      error: error.message
    });
  }
};

/**
 * @desc    Update user
 * @route   PUT /api/admin/users/:userId
 * @access  Admin only
 */
const updateUser = async (req, res) => {
  try {
    const { userId } = req.params;
    const { firstName, lastName, email, phoneNumber, userType, isActive, emailVerified } = req.body;

    const user = await User.findByPk(userId);

    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }

    // Update fields
    if (firstName) user.firstName = firstName;
    if (lastName) user.lastName = lastName;
    if (email) user.email = email.toLowerCase().trim();
    if (phoneNumber !== undefined) user.phoneNumber = phoneNumber;
    if (userType) user.userType = userType;
    if (isActive !== undefined) user.isActive = isActive;
    if (emailVerified !== undefined) user.emailVerified = emailVerified;

    await user.save();

    // Return updated user without password
    const updatedUser = user.toJSON();
    delete updatedUser.password;

    return res.status(200).json({
      success: true,
      message: 'User updated successfully',
      data: updatedUser
    });
  } catch (error) {
    console.error('Update user error:', error);
    
    if (error.name === 'SequelizeUniqueConstraintError') {
      return res.status(400).json({
        success: false,
        message: 'Email already exists'
      });
    }

    return res.status(500).json({
      success: false,
      message: 'Failed to update user',
      error: error.message
    });
  }
};

/**
 * @desc    Delete/deactivate user
 * @route   DELETE /api/admin/users/:userId
 * @access  Admin only
 */
const deleteUser = async (req, res) => {
  try {
    const { userId } = req.params;
    const { permanent = false } = req.query;

    const user = await User.findByPk(userId);

    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }

    // Prevent admin from deleting themselves
    if (user.id === req.user.id) {
      return res.status(400).json({
        success: false,
        message: 'You cannot delete your own account'
      });
    }

    if (permanent === 'true') {
      // Permanent deletion
      await user.destroy();
      return res.status(200).json({
        success: true,
        message: 'User permanently deleted'
      });
    } else {
      // Soft delete - deactivate account
      user.isActive = false;
      await user.save();
      return res.status(200).json({
        success: true,
        message: 'User account deactivated'
      });
    }
  } catch (error) {
    console.error('Delete user error:', error);
    return res.status(500).json({
      success: false,
      message: 'Failed to delete user',
      error: error.message
    });
  }
};

/**
 * @desc    Get all bookings (placeholder - implement when booking model exists)
 * @route   GET /api/admin/bookings
 * @access  Admin only
 */
const getAllBookings = async (req, res) => {
  try {
    // TODO: Implement when Booking model is created
    return res.status(200).json({
      success: true,
      message: 'Bookings endpoint - to be implemented',
      data: []
    });
  } catch (error) {
    console.error('Get all bookings error:', error);
    return res.status(500).json({
      success: false,
      message: 'Failed to fetch bookings',
      error: error.message
    });
  }
};

/**
 * @desc    Get system statistics
 * @route   GET /api/admin/stats
 * @access  Admin only
 */
const getSystemStats = async (req, res) => {
  try {
    const totalUsers = await User.count();
    const activeUsers = await User.count({ where: { isActive: true } });
    const petOwners = await User.count({ where: { userType: 'pet_owner' } });
    const admins = await User.count({ where: { userType: 'admin' } });

    return res.status(200).json({
      success: true,
      data: {
        users: {
          total: totalUsers,
          active: activeUsers,
          petOwners,
          admins
        },
        bookings: {
          total: 0, // TODO: Implement when booking model exists
          pending: 0,
          completed: 0
        }
      }
    });
  } catch (error) {
    console.error('Get system stats error:', error);
    return res.status(500).json({
      success: false,
      message: 'Failed to fetch system statistics',
      error: error.message
    });
  }
};

/**
 * @desc    Update system configuration (placeholder)
 * @route   PUT /api/admin/config
 * @access  Admin only
 */
const updateSystemConfig = async (req, res) => {
  try {
    // TODO: Implement configuration management
    return res.status(200).json({
      success: true,
      message: 'System configuration updated'
    });
  } catch (error) {
    console.error('Update system config error:', error);
    return res.status(500).json({
      success: false,
      message: 'Failed to update system configuration',
      error: error.message
    });
  }
};

module.exports = {
  getAllUsers,
  getUserById,
  updateUser,
  deleteUser,
  getAllBookings,
  getSystemStats,
  updateSystemConfig
};

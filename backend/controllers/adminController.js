const { User, Booking, EmergencyRequest, ContactMessage, Pet, Notification } = require('../models');
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
      order: [['dateJoined', 'DESC']]
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
      attributes: { exclude: ['password', 'twoFactorSecret', 'backupCodes'] },
      include: [
        {
          model: Pet,
          as: 'pets',
          attributes: ['pet_id', 'name', 'breed', 'age', 'weight', 'sex', 'photo', 'created_at'],
          required: false
        }
      ]
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
    const { 
      firstName, 
      lastName, 
      email, 
      phoneNumber, 
      userType, 
      isActive, 
      emailVerified,
      address,
      city,
      emergencyContactName,
      emergencyContactNumber
    } = req.body;

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
    if (address !== undefined) user.address = address;
    if (city !== undefined) user.city = city;
    if (emergencyContactName !== undefined) user.emergencyContactName = emergencyContactName;
    if (emergencyContactNumber !== undefined) user.emergencyContactNumber = emergencyContactNumber;

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

    // Deactivate account (temporary suspension by admin)
    // Note: For permanent account deletion, only the user themselves can do it via deleteAccount
    user.isActive = false;
    await user.save();
    
    return res.status(200).json({
      success: true,
      message: 'User account deactivated successfully. User will not be able to login.',
      data: {
        userId: user.id,
        email: user.email,
        isActive: user.isActive
      }
    });
  } catch (error) {
    console.error('Delete user error:', error);
    return res.status(500).json({
      success: false,
      message: 'Failed to deactivate user',
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
    const { page = 1, limit = 20, status, service_type, payment_status } = req.query;
    const offset = (page - 1) * limit;

    // Build where clause for filtering
    const whereClause = {};
    if (status) whereClause.booking_status = status;
    if (service_type) whereClause.service_type = service_type;
    if (payment_status) whereClause.payment_status = payment_status;

    // Fetch all bookings with pagination
    const { count, rows: bookings } = await Booking.findAndCountAll({
      where: whereClause,
      include: [
        {
          model: Pet,
          as: 'pet',
          attributes: ['pet_id', 'name', 'breed', 'photo']
        },
        {
          model: User,
          as: 'user',
          attributes: ['id', 'firstName', 'lastName', 'email', 'phoneNumber']
        }
      ],
      order: [['created_at', 'DESC']],
      limit: parseInt(limit),
      offset: parseInt(offset)
    });

    return res.status(200).json({
      success: true,
      count: bookings.length,
      total: count,
      page: parseInt(page),
      pages: Math.ceil(count / limit),
      data: bookings
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
    const petOwners = await User.count({ where: { userType: 'pet_owner', isActive: true } });
    const admins = await User.count({ where: { userType: 'admin', isActive: true } });

    // Get booking statistics
    const totalBookings = await Booking.count();
    const pendingBookings = await Booking.count({ where: { booking_status: 'pending' } });
    const completedBookings = await Booking.count({ where: { booking_status: 'completed' } });
    const confirmedBookings = await Booking.count({ where: { booking_status: 'confirmed' } });

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
          total: totalBookings,
          pending: pendingBookings,
          confirmed: confirmedBookings,
          completed: completedBookings
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

/**
 * @desc    Get notification summary counts
 * @route   GET /api/admin/notifications/summary
 * @access  Admin only
 */
const getNotificationSummary = async (req, res) => {
  try {
    const { Review, Notification } = require('../models');
    const adminId = req.user.id;
    
    const [pendingBookings, unreadMessages, openEmergency, pendingReviews, newUserNotifications, newPetNotifications] = await Promise.all([
      Notification.count({ where: { user_id: adminId, type: 'booking_created', is_read: false } }),
      ContactMessage.count({ where: { status: 'unread' } }),
      Notification.count({ where: { user_id: adminId, type: 'emergency_created', is_read: false } }),
      Notification.count({ where: { user_id: adminId, type: 'review', is_read: false } }),
      Notification.count({ where: { user_id: adminId, type: 'user_registered', is_read: false } }),
      Notification.count({ where: { user_id: adminId, type: 'pet_registered', is_read: false } })
    ]);

    return res.status(200).json({
      success: true,
      data: {
        pendingBookings,
        contactMessages: unreadMessages,
        emergencyRequests: openEmergency,
        pendingReviews,
        newUsers: newUserNotifications,
        newPets: newPetNotifications
      }
    });
  } catch (error) {
    console.error('Get notification summary error:', error);
    return res.status(500).json({
      success: false,
      message: 'Failed to fetch notification summary',
      error: error.message
    });
  }
};

/**
 * @desc    Get emergency requests for admin
 * @route   GET /api/admin/emergency-requests
 * @access  Admin only
 */
const getEmergencyRequests = async (req, res) => {
  try {
    const { status } = req.query;
    const whereClause = {};

    if (status) {
      whereClause.status = status;
    } else {
      whereClause.status = { [Op.in]: ['pending', 'in_progress'] };
    }

    const requests = await EmergencyRequest.findAll({
      where: whereClause,
      include: [
        { model: User, as: 'user', attributes: ['id', 'firstName', 'lastName', 'email'] },
        { model: Pet, as: 'pet', attributes: ['pet_id', 'name'] }
      ],
      order: [['created_at', 'DESC']]
    });

    return res.status(200).json({
      success: true,
      data: requests
    });
  } catch (error) {
    console.error('Get emergency requests error:', error);
    return res.status(500).json({
      success: false,
      message: 'Failed to fetch emergency requests',
      error: error.message
    });
  }
};

/**
 * @desc    Get all pets in the system
 * @route   GET /api/admin/pets
 * @access  Admin only
 */
const getAllPets = async (req, res) => {
  try {
    const { page = 1, limit = 20, search } = req.query;
    const offset = (page - 1) * limit;

    // Build query conditions
    const whereClause = {}; // Paranoid mode handles soft deletes automatically
    
    if (search) {
      whereClause[Op.or] = [
        { name: { [Op.iLike]: `%${search}%` } }
      ];
    }

    const { count, rows: pets } = await Pet.findAndCountAll({
      where: whereClause,
      include: [
        {
          model: User,
          as: 'owner',
          attributes: ['id', 'firstName', 'lastName', 'email', 'phoneNumber']
        }
      ],
      limit: parseInt(limit),
      offset: parseInt(offset),
      order: [['created_at', 'DESC']]
    });

    return res.status(200).json({
      success: true,
      data: pets,
      pagination: {
        total: count,
        page: parseInt(page),
        limit: parseInt(limit),
        pages: Math.ceil(count / limit)
      }
    });
  } catch (error) {
    console.error('Get all pets error:', error);
    return res.status(500).json({
      success: false,
      message: 'Failed to fetch pets',
      error: error.message
    });
  }
};

/**
 * @desc    Get pet by ID with details
 * @route   GET /api/admin/pets/:petId
 * @access  Admin only
 */
const getPetById = async (req, res) => {
  try {
    const { petId } = req.params;

    const pet = await Pet.findByPk(petId, {
      include: [
        {
          model: User,
          as: 'owner',
          attributes: ['id', 'firstName', 'lastName', 'email', 'phoneNumber']
        }
      ]
    });

    if (!pet) {
      return res.status(404).json({
        success: false,
        message: 'Pet not found'
      });
    }

    return res.status(200).json({
      success: true,
      data: pet
    });
  } catch (error) {
    console.error('Get pet by ID error:', error);
    return res.status(500).json({
      success: false,
      message: 'Failed to fetch pet',
      error: error.message
    });
  }
};

/**
 * @desc    Delete/soft delete pet
 * @route   DELETE /api/admin/pets/:petId
 * @access  Admin only
 */
const deletePet = async (req, res) => {
  try {
    const { petId } = req.params;
    const { permanent = false } = req.query;

    const pet = await Pet.findByPk(petId);

    if (!pet) {
      return res.status(404).json({
        success: false,
        message: 'Pet not found'
      });
    }

    const petName = pet.name;
    const petOwnerId = pet.user_id;

    if (permanent === 'true') {
      // Permanent deletion (force destroy for paranoid model)
      await pet.destroy({ force: true });
    } else {
      // Soft delete via paranoid model (sets deleted_at)
      await pet.destroy();
    }

    // Create notification for the pet owner
    if (petOwnerId) {
      await Notification.create({
        user_id: petOwnerId,
        type: 'pet_deleted',
        title: 'Pet Deleted',
        message: `Your pet ${petName} has been deleted by an administrator.`,
        isRead: false
      });
    }

    return res.status(200).json({
      success: true,
      message: 'Pet deleted successfully'
    });
  } catch (error) {
    console.error('Delete pet error:', error);
    return res.status(500).json({
      success: false,
      message: 'Failed to delete pet',
      error: error.message
    });
  }
};

/**
 * @desc    Update pet information (Admin)
 * @route   PATCH /api/admin/pets/:petId
 * @access  Admin only
 */
const updatePet = async (req, res) => {
  try {
    const { petId } = req.params;
    const { name, breed, age, weight, height, sex, allergies, triggering_point, medical_history } = req.body;

    const pet = await Pet.findByPk(petId);

    if (!pet) {
      return res.status(404).json({
        success: false,
        message: 'Pet not found'
      });
    }

    // Prepare update data
    const updateData = {};

    if (name !== undefined) updateData.name = name ? name.trim() : pet.name;
    if (breed !== undefined) updateData.breed = breed ? breed.trim() : pet.breed;
    if (age !== undefined) updateData.age = age ? parseInt(age) : pet.age;
    if (weight !== undefined) updateData.weight = weight ? parseFloat(weight) : pet.weight;
    if (height !== undefined) updateData.height = height ? parseFloat(height) : pet.height;
    if (sex !== undefined) updateData.sex = sex ? sex.trim() : pet.sex;
    if (allergies !== undefined) updateData.allergies = allergies?.trim() || null;
    if (triggering_point !== undefined) updateData.triggering_point = triggering_point?.trim() || null;
    if (medical_history !== undefined) updateData.medical_history = medical_history?.trim() || null;

    // Update the pet
    await pet.update(updateData);

    const updatedPet = await Pet.findByPk(petId, {
      include: [
        {
          model: User,
          as: 'owner',
          attributes: ['id', 'firstName', 'lastName', 'email', 'phoneNumber']
        }
      ]
    });

    return res.status(200).json({
      success: true,
      message: 'Pet updated successfully',
      data: updatedPet
    });
  } catch (error) {
    console.error('Update pet error:', error);
    return res.status(500).json({
      success: false,
      message: 'Failed to update pet',
      error: error.message
    });
  }
};

/**
 * @desc    Mark all pending bookings as read
 * @route   PUT /api/admin/bookings/mark-read
 * @access  Admin only
 */
const markPendingBookingsAsRead = async (req, res) => {
  try {
    const adminId = req.user.id;
    
    await Notification.update(
      { is_read: true },
      {
        where: {
          user_id: adminId,
          type: 'booking_created',
          is_read: false
        }
      }
    );

    return res.status(200).json({
      success: true,
      message: 'Pending booking notifications marked as read'
    });
  } catch (error) {
    console.error('Mark pending bookings as read error:', error);
    return res.status(500).json({
      success: false,
      message: 'Failed to mark bookings as read',
      error: error.message
    });
  }
};

/**
 * @desc    Mark all emergency requests as read
 * @route   PUT /api/admin/emergency/mark-read
 * @access  Admin only
 */
const markEmergencyRequestsAsRead = async (req, res) => {
  try {
    const adminId = req.user.id;
    
    await Notification.update(
      { is_read: true },
      {
        where: {
          user_id: adminId,
          type: 'emergency_created',
          is_read: false
        }
      }
    );

    return res.status(200).json({
      success: true,
      message: 'Emergency request notifications marked as read'
    });
  } catch (error) {
    console.error('Mark emergency requests as read error:', error);
    return res.status(500).json({
      success: false,
      message: 'Failed to mark emergency requests as read',
      error: error.message
    });
  }
};

/**
 * @desc    Mark all pending reviews as read
 * @route   PUT /api/admin/reviews/mark-read
 * @access  Admin only
 */
const markPendingReviewsAsRead = async (req, res) => {
  try {
    const adminId = req.user.id;
    
    await Notification.update(
      { is_read: true },
      {
        where: {
          user_id: adminId,
          type: 'review',
          is_read: false
        }
      }
    );

    return res.status(200).json({
      success: true,
      message: 'Review notifications marked as read'
    });
  } catch (error) {
    console.error('Mark pending reviews as read error:', error);
    return res.status(500).json({
      success: false,
      message: 'Failed to mark reviews as read',
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
  updateSystemConfig,
  getNotificationSummary,
  getEmergencyRequests,
  getAllPets,
  getPetById,
  updatePet,
  deletePet,
  markPendingBookingsAsRead,
  markEmergencyRequestsAsRead,
  markPendingReviewsAsRead
};

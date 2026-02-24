const { User, PasswordReset, Pet, Booking, EmergencyRequest, ActivityLog, WellnessTimeline } = require('../models');
const {
  sendPasswordResetEmail,
  sendPasswordChangedEmail,
  sendOTPEmail
} = require('../utils/emailService');
const { generateTokens, verifyToken, getTokenExpiry } = require('../utils/jwtHelper');
const config = require('../config/config');
const bcrypt = require('bcrypt');

/**
 * @route   POST /api/accounts/register
 * @desc    Register a new user
 * @access  Public
 */
const register = async (req, res) => {
  try {
    console.log('📥 Registration request received:', {
      email: req.body.email,
      firstName: req.body.firstName,
      lastName: req.body.lastName,
      userType: req.body.userType
    });

    const { email, password, firstName, lastName, phoneNumber, userType } = req.body;
    const normalizedEmail = email.toLowerCase().trim();

    // Check if user with this email already exists
    const existingUser = await User.findOne({
      where: { email: normalizedEmail }
    });

    if (existingUser) {
      // If user exists but account is inactive (soft-deleted), reactivate it
      if (!existingUser.isActive) {
        console.log('🔄 Reactivating deleted account:', existingUser.email);
        
        // STEP 1: Hard delete all old data to ensure fresh start
        console.log('🗑️ Deleting all old data for user:', existingUser.id);
        
        // Get all pet IDs (including soft-deleted ones) before deleting
        const oldPets = await Pet.findAll({
          where: { user_id: existingUser.id },
          paranoid: false // Include soft-deleted pets
        });
        const oldPetIds = oldPets.map(pet => pet.id);
        console.log('Found old pets:', oldPetIds.length);
        
        // Delete wellness timeline entries for old pets
        if (oldPetIds.length > 0) {
          const deletedTimeline = await WellnessTimeline.destroy({
            where: { pet_id: oldPetIds },
            force: true
          });
          console.log('Deleted wellness timeline entries:', deletedTimeline);
        }
        
        // Hard delete all pets (including soft-deleted ones)
        const deletedPets = await Pet.destroy({
          where: { user_id: existingUser.id },
          force: true,
          paranoid: false
        });
        console.log('Deleted pets:', deletedPets);
        
        // Hard delete all bookings
        const deletedBookings = await Booking.destroy({
          where: { user_id: existingUser.id },
          force: true
        });
        console.log('Deleted bookings:', deletedBookings);
        
        // Hard delete all emergency requests
        const deletedEmergencies = await EmergencyRequest.destroy({
          where: { user_id: existingUser.id },
          force: true
        });
        console.log('Deleted emergency requests:', deletedEmergencies);
        
        // Hard delete all activity logs
        const deletedLogs = await ActivityLog.destroy({
          where: { user_id: existingUser.id },
          force: true
        });
        console.log('Deleted activity logs:', deletedLogs);
        
        // STEP 2: Update user with new data and reactivate
        existingUser.password = password; // Will be hashed by beforeUpdate hook
        existingUser.firstName = firstName;
        existingUser.lastName = lastName;
        existingUser.phoneNumber = phoneNumber;
        existingUser.userType = userType || 'pet_owner';
        existingUser.emailVerified = true;
        existingUser.isActive = true;
        existingUser.isProfileComplete = false;
        existingUser.profilePicture = null; // Reset profile picture
        existingUser.address = null;
        existingUser.city = null;
        existingUser.emergencyContactName = null;
        existingUser.emergencyContactNumber = null;
        
        await existingUser.save();
        
        console.log('✅ Account reactivated successfully:', existingUser.email);
        
        return res.status(201).json({
          success: true,
          message: 'Registration successful! Your account has been reactivated. You can now login.',
          email: existingUser.email
        });
      } else {
        // User exists and is active - cannot register again
        console.log('❌ Active user already exists:', normalizedEmail);
        return res.status(400).json({
          success: false,
          message: 'User with this email already exists',
          errors: {
            email: ['This email is already registered']
          }
        });
      }
    }

    // Create new user if doesn't exist
    const user = await User.create({
      email: normalizedEmail,
      password,
      firstName,
      lastName,
      phoneNumber,
      userType: userType || 'pet_owner',
      emailVerified: true,
      isActive: true,
      isProfileComplete: false
    });

    console.log('✅ User created successfully:', user.email);

    return res.status(201).json({
      success: true,
      message: 'Registration successful! You can now login.',
      email: user.email
    });
  } catch (error) {
    console.error('❌ Registration error:', error);
    
    // Handle Sequelize validation errors
    if (error.name === 'SequelizeValidationError') {
      const errors = {};
      error.errors.forEach(err => {
        errors[err.path] = [err.message];
      });
      return res.status(400).json({
        success: false,
        message: 'Validation error',
        errors
      });
    }
    
    // Handle unique constraint errors (shouldn't happen now, but keep as fallback)
    if (error.name === 'SequelizeUniqueConstraintError') {
      const errors = {};
      error.errors.forEach(err => {
        errors[err.path] = ['This value already exists'];
      });
      return res.status(400).json({
        success: false,
        message: 'User with this email already exists',
        errors
      });
    }
    
    return res.status(500).json({
      success: false,
      message: 'An error occurred during registration.',
      error: error.message
    });
  }
};



/**
 * @route   POST /api/accounts/login
 * @desc    Login user
 * @access  Public
 */
const login = async (req, res) => {
  try {
    const { email, password } = req.body;

    // Find user by email
    const user = await User.findOne({
      where: { email: email.toLowerCase().trim() }
    });

    if (!user) {
      return res.status(401).json({
        success: false,
        message: 'Invalid email or password.'
      });
    }

    // Check if account is active
    if (!user.isActive) {
      return res.status(403).json({
        success: false,
        message: 'Your account has been deactivated. Please contact support.'
      });
    }

    // Verify password
    const isPasswordValid = await user.checkPassword(password);
    if (!isPasswordValid) {
      return res.status(401).json({
        success: false,
        message: 'Invalid email or password.'
      });
    }

    // Update last login
    user.lastLogin = new Date();
    await user.save();

    // Generate JWT tokens
    const { accessToken, refreshToken } = generateTokens(user.id);

    // Calculate token expiry times in milliseconds
    const accessExpiry = getTokenExpiry(config.jwt.accessTokenExpire);
    const refreshExpiry = getTokenExpiry(config.jwt.refreshTokenExpire);

    // Set httpOnly cookies
    res.cookie('accessToken', accessToken, {
      httpOnly: true,
      secure: config.NODE_ENV === 'production', // HTTPS only in production
      sameSite: 'strict',
      maxAge: accessExpiry
    });

    res.cookie('refreshToken', refreshToken, {
      httpOnly: true,
      secure: config.NODE_ENV === 'production',
      sameSite: 'strict',
      maxAge: refreshExpiry
    });

    // Prepare user data
    const userData = user.toJSON();

    // Ensure isProfileComplete is explicitly boolean
    userData.isProfileComplete = !!userData.isProfileComplete;

    return res.status(200).json({
      success: true,
      message: 'Login successful!',
      user: userData
    });
  } catch (error) {
    console.error('Login error:', error);
    return res.status(500).json({
      success: false,
      message: 'An error occurred during login.',
      error: error.message
    });
  }
};

/**
 * @route   POST /api/accounts/forgot-password
 * @desc    Request password reset with OTP
 * @access  Public
 */
const forgotPassword = async (req, res) => {
  try {
    const { email } = req.body;

    // Find user (but don't reveal if user exists)
    const user = await User.findOne({
      where: { email: email.toLowerCase().trim() }
    });

    if (user) {
      // Generate 6-digit OTP
      const otp = Math.floor(100000 + Math.random() * 900000).toString();
      
      // Hash the OTP before storing
      const otpHash = await bcrypt.hash(otp, 10);

      // Delete any existing password reset requests for this user
      await PasswordReset.destroy({
        where: { userId: user.id }
      });

      // Create password reset record with OTP
      const reset = await PasswordReset.create({
        userId: user.id,
        otpHash: otpHash,
        otpAttempts: 0,
        maxOtpAttempts: 5,
        isVerified: false,
        isUsed: false,
        expiresAt: new Date(Date.now() + 10 * 60 * 1000) // 10 minutes
      });

      // Send OTP email
      await sendOTPEmail(user, otp);

      console.log(`✉️ OTP sent to ${user.email} (Reset ID: ${reset.id})`);
    }

    // Always return success message (security best practice)
    return res.status(200).json({
      success: true,
      message: 'If an account exists with this email, you will receive an OTP shortly.',
      instructions: 'Please check your email inbox and spam folder for the 6-digit verification code.'
    });
  } catch (error) {
    console.error('Forgot password error:', error);
    return res.status(500).json({
      success: false,
      message: 'An error occurred while processing your request.',
      error: error.message
    });
  }
};

/**
 * @route   POST /api/accounts/verify-otp
 * @desc    Verify OTP and get reset token
 * @access  Public
 */
const verifyOTP = async (req, res) => {
  try {
    const { email, otp } = req.body;

    // Find user
    const user = await User.findOne({
      where: { email: email.toLowerCase().trim() }
    });

    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'Invalid verification request.'
      });
    }

    // Find password reset record
    const reset = await PasswordReset.findOne({
      where: { 
        userId: user.id,
        isUsed: false
      },
      order: [['createdAt', 'DESC']]
    });

    if (!reset) {
      return res.status(404).json({
        success: false,
        message: 'No password reset request found. Please request a new OTP.'
      });
    }

    // Check if expired
    if (reset.isExpired()) {
      return res.status(400).json({
        success: false,
        message: 'OTP has expired. Please request a new one.',
        code: 'OTP_EXPIRED'
      });
    }

    // Check if already verified
    if (reset.isVerified) {
      return res.status(400).json({
        success: false,
        message: 'OTP has already been verified. Please proceed to reset your password.',
        resetToken: reset.token
      });
    }

    // Check if max attempts reached
    if (reset.otpAttempts >= reset.maxOtpAttempts) {
      return res.status(400).json({
        success: false,
        message: 'Maximum OTP verification attempts exceeded. Please request a new OTP.',
        code: 'MAX_ATTEMPTS_EXCEEDED'
      });
    }

    // Verify OTP
    const isOTPValid = await bcrypt.compare(otp, reset.otpHash);

    if (!isOTPValid) {
      // Increment attempts
      await reset.incrementAttempts();
      const remainingAttempts = reset.maxOtpAttempts - reset.otpAttempts - 1;

      return res.status(400).json({
        success: false,
        message: `Invalid OTP. You have ${remainingAttempts} attempt${remainingAttempts !== 1 ? 's' : ''} remaining.`,
        remainingAttempts: remainingAttempts,
        code: 'INVALID_OTP'
      });
    }

    // OTP is valid - mark as verified and generate token for password reset
    reset.isVerified = true;
    await reset.save();

    console.log(`✅ OTP verified for user ${user.email} (Reset ID: ${reset.id})`);

    return res.status(200).json({
      success: true,
      message: 'OTP verified successfully! You can now reset your password.',
      resetToken: reset.token
    });
  } catch (error) {
    console.error('Verify OTP error:', error);
    return res.status(500).json({
      success: false,
      message: 'An error occurred while verifying OTP.',
      error: error.message
    });
  }
};

/**
 * @route   POST /api/accounts/reset-password
 * @desc    Reset user password with verified token
 * @access  Public
 */
const resetPassword = async (req, res) => {
  try {
    const { token, newPassword } = req.body;

    // Find password reset record
    const reset = await PasswordReset.findOne({
      where: { token },
      include: [{
        model: User,
        as: 'user'
      }]
    });

    if (!reset) {
      return res.status(404).json({
        success: false,
        message: 'Invalid password reset token.'
      });
    }

    // Check if already used
    if (reset.isUsed) {
      return res.status(400).json({
        success: false,
        message: 'This password reset link has already been used.'
      });
    }

    // Check if expired
    if (reset.isExpired()) {
      return res.status(400).json({
        success: false,
        message: 'This password reset link has expired. Please request a new one.'
      });
    }

    // Check if OTP was verified (for OTP flow)
    if (reset.otpHash && !reset.isVerified) {
      return res.status(400).json({
        success: false,
        message: 'Please verify your OTP before resetting password.',
        code: 'OTP_NOT_VERIFIED'
      });
    }

    // Update password
    reset.user.password = newPassword;
    await reset.user.save();

    // Mark token as used
    reset.isUsed = true;
    await reset.save();

    // Send confirmation email
    await sendPasswordChangedEmail(reset.user);

    console.log(`🔒 Password reset successful for user ${reset.user.email}`);

    return res.status(200).json({
      success: true,
      message: 'Password reset successful! You can now login with your new password.'
    });
  } catch (error) {
    console.error('Reset password error:', error);
    return res.status(500).json({
      success: false,
      message: 'An error occurred while resetting your password.',
      error: error.message
    });
  }
};

/**
 * @route   GET /api/accounts/profile
 * @desc    Get current user profile
 * @access  Private
 */
const getProfile = async (req, res) => {
  try {
    const userData = req.user.toJSON();
    userData.isProfileComplete = !!userData.isProfileComplete;

    return res.status(200).json({
      success: true,
      user: userData
    });
  } catch (error) {
    console.error('Get profile error:', error);
    return res.status(500).json({
      success: false,
      message: 'An error occurred while fetching your profile.',
      error: error.message
    });
  }
};


/**
 * @route   PUT /api/accounts/profile
 * @desc    Update user profile
 * @access  Private
 */
const updateProfile = async (req, res) => {
  try {
    console.log('📝 Update profile request received');
    console.log('Request body:', req.body);
    console.log('Request file:', req.file);
    
    const { 
      firstName, 
      lastName, 
      phoneNumber, 
      address, 
      city, 
      emergencyContactName, 
      emergencyContactNumber 
    } = req.body;
    
    const userId = req.user.id; // Corrected: retrieve ID from authenticated user

    const user = await User.findByPk(userId);

    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found.'
      });
    }

    // Handle profile picture upload
    if (req.file) {
      console.log('📷 Profile picture uploaded:', req.file.path);
      user.profilePicture = req.file.path;
    } else {
      console.log('⚠️ No file received in request');
    }

    // Update fields if provided
    if (firstName) user.firstName = firstName;
    if (lastName) user.lastName = lastName;
    if (phoneNumber) user.phoneNumber = phoneNumber;
    if (address) user.address = address;
    if (city) user.city = city;
    if (emergencyContactName) user.emergencyContactName = emergencyContactName;
    if (emergencyContactNumber) user.emergencyContactNumber = emergencyContactNumber;

    // Check if profile is complete
    // Required: firstName, lastName, phoneNumber, address, city, emergencyContactName, emergencyContactNumber, profilePicture
    const isComplete = !!(
      user.firstName && 
      user.lastName && 
      user.phoneNumber && 
      user.address && 
      user.city && 
      user.emergencyContactName && 
      user.emergencyContactNumber && 
      user.profilePicture
    );
    
    user.isProfileComplete = isComplete;

    await user.save();

    return res.status(200).json({
      success: true,
      message: 'Profile updated successfully.',
      user: user.toJSON()
    });
  } catch (error) {
    console.error('Update profile error:', error);
    return res.status(500).json({
      success: false,
      message: 'An error occurred while updating profile.',
      error: error.message
    });
  }
};

/**
 * Delete user account
 * @route   DELETE /api/accounts/profile
 * @desc    Soft delete user account and all related data (pets, bookings, emergency requests)
 * @access  Private
 */
const deleteAccount = async (req, res) => {
  try {
    const userId = req.user.id;

    const user = await User.findByPk(userId);

    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found.'
      });
    }

    // Soft delete user's pets (paranoid mode will set deleted_at)
    await Pet.destroy({
      where: { user_id: userId }
    });
    console.log(`✅ Soft deleted pets for user ${userId}`);

    // Cancel all user's bookings
    await Booking.update(
      { status: 'cancelled' },
      { where: { user_id: userId, status: ['pending', 'confirmed'] } }
    );
    console.log(`✅ Cancelled bookings for user ${userId}`);

    // Cancel all user's emergency requests
    await EmergencyRequest.update(
      { status: 'cancelled' },
      { where: { user_id: userId, status: ['pending', 'in_progress'] } }
    );
    console.log(`✅ Cancelled emergency requests for user ${userId}`);

    // Soft delete user account: Set isActive to false
    user.isActive = false;
    await user.save();
    console.log(`✅ Soft deleted user account ${userId}`);

    // Clear authentication cookies
    res.clearCookie('accessToken', {
      httpOnly: true,
      secure: config.NODE_ENV === 'production',
      sameSite: 'strict'
    });
    res.clearCookie('refreshToken', {
      httpOnly: true,
      secure: config.NODE_ENV === 'production',
      sameSite: 'strict'
    });

    return res.status(200).json({
      success: true,
      message: 'Account deleted successfully.'
    });
  } catch (error) {
    console.error('Delete account error:', error);
    return res.status(500).json({
      success: false,
      message: 'An error occurred while deleting account.',
      error: error.message
    });
  }
};

/**
 * @route   POST /api/accounts/token/refresh
 * @desc    Refresh access token
 * @access  Public
 */
const refreshToken = async (req, res) => {
  try {
    // Get refresh token from cookie
    const refresh = req.cookies.refreshToken;

    if (!refresh) {
      return res.status(400).json({
        success: false,
        message: 'Refresh token is required.'
      });
    }

    // Verify refresh token
    const decoded = verifyToken(refresh);

    if (!decoded || decoded.type !== 'refresh') {
      return res.status(401).json({
        success: false,
        message: 'Invalid or expired refresh token.'
      });
    }

    // Get user
    const user = await User.findByPk(decoded.userId);

    if (!user || !user.isActive) {
      return res.status(401).json({
        success: false,
        message: 'User not found or inactive.'
      });
    }

    // Generate new access token
    const { accessToken } = generateTokens(user.id);
    const accessExpiry = getTokenExpiry(config.jwt.accessTokenExpire);

    // Set new access token cookie
    res.cookie('accessToken', accessToken, {
      httpOnly: true,
      secure: config.NODE_ENV === 'production',
      sameSite: 'strict',
      maxAge: accessExpiry
    });

    return res.status(200).json({
      success: true,
      message: 'Token refreshed successfully'
    });
  } catch (error) {
    console.error('Refresh token error:', error);
    return res.status(500).json({
      success: false,
      message: 'An error occurred while refreshing token.',
      error: error.message
    });
  }
};

/**
 * @route   POST /api/accounts/logout
 * @desc    Logout user and clear cookies
 * @access  Private
 */
const logout = async (req, res) => {
  try {
    // Clear httpOnly cookies
    res.clearCookie('accessToken', {
      httpOnly: true,
      secure: config.NODE_ENV === 'production',
      sameSite: 'strict'
    });

    res.clearCookie('refreshToken', {
      httpOnly: true,
      secure: config.NODE_ENV === 'production',
      sameSite: 'strict'
    });

    return res.status(200).json({
      success: true,
      message: 'Logout successful.'
    });
  } catch (error) {
    console.error('Logout error:', error);
    return res.status(500).json({
      success: false,
      message: 'An error occurred during logout.',
      error: error.message
    });
  }
};





module.exports = {
  register,
  login,
  forgotPassword,
  verifyOTP,
  resetPassword,
  getProfile,
  updateProfile,
  deleteAccount,
  refreshToken,
  logout
};

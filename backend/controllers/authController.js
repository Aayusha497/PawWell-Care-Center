const { User, PasswordReset } = require('../models');
const {
  sendPasswordResetEmail,
  sendPasswordChangedEmail
} = require('../utils/emailService');
const { generateTokens, verifyToken, getTokenExpiry } = require('../utils/jwtHelper');
const config = require('../config/config');

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

    // Create user - active and verified immediately
    const user = await User.create({
      email: email.toLowerCase().trim(),
      password,
      firstName,
      lastName,
      phoneNumber,
      userType: userType || 'pet_owner',
      emailVerified: true,
      isActive: true
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
    
    // Handle unique constraint errors
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

    // Calculate token expiry times
    const accessExpiry = getTokenExpiry(config.jwt.accessTokenExpire);
    const refreshExpiry = getTokenExpiry(config.jwt.refreshTokenExpire);

    // Prepare user data
    const userData = user.toJSON();

    return res.status(200).json({
      success: true,
      message: 'Login successful!',
      access: accessToken,
      refresh: refreshToken,
      user: userData,
      accessTokenExpiry: accessExpiry,
      refreshTokenExpiry: refreshExpiry
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
 * @desc    Request password reset
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
      // Create password reset token
      const reset = await PasswordReset.create({
        userId: user.id
      });

      // Send password reset email
      await sendPasswordResetEmail(user, reset.token);
    }

    // Always return success message (security best practice)
    return res.status(200).json({
      success: true,
      message: 'If an account exists with this email, you will receive a password reset link shortly.',
      instructions: 'Please check your email inbox and spam folder.'
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
 * @route   POST /api/accounts/reset-password
 * @desc    Reset user password
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

    // Update password
    reset.user.password = newPassword;
    await reset.user.save();

    // Mark token as used
    reset.isUsed = true;
    await reset.save();

    // Send confirmation email
    await sendPasswordChangedEmail(reset.user);

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
 * @route   POST /api/accounts/token/refresh
 * @desc    Refresh access token
 * @access  Public
 */
const refreshToken = async (req, res) => {
  try {
    const { refresh } = req.body;

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

    return res.status(200).json({
      success: true,
      access: accessToken,
      accessTokenExpiry: accessExpiry
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
 * @desc    Logout user (blacklist token - future implementation)
 * @access  Private
 */
const logout = async (req, res) => {
  try {
    // In a production app, you'd blacklist the refresh token here
    // For now, just return success as token expiration handles security

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
  resetPassword,
  getProfile,
  refreshToken,
  logout
};

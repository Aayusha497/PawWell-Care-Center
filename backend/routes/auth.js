const express = require('express');
const router = express.Router();
const authController = require('../controllers/authController');
const { authenticate } = require('../middleware/auth');
const { handleValidationErrors } = require('../middleware/validator');
const { authLimiter, passwordResetLimiter, otpVerificationLimiter } = require('../middleware/rateLimiter');
const {
  registerValidation,
  loginValidation,
  forgotPasswordValidation,
  verifyOTPValidation,
  resetPasswordValidation
} = require('../validators/authValidators');

/**
 * @route   POST /api/accounts/register
 * @desc    Register a new user
 * @access  Public
 */
router.post(
  '/register',
  authLimiter,
  registerValidation,
  handleValidationErrors,
  authController.register
);

/**
 * @route   POST /api/accounts/login
 * @desc    Login user
 * @access  Public
 */
router.post(
  '/login',
  authLimiter,
  loginValidation,
  handleValidationErrors,
  authController.login
);

/**
 * @route   POST /api/accounts/forgot-password
 * @desc    Request password reset with OTP
 * @access  Public
 */
router.post(
  '/forgot-password',
  passwordResetLimiter,
  forgotPasswordValidation,
  handleValidationErrors,
  authController.forgotPassword
);

/**
 * @route   POST /api/accounts/verify-otp
 * @desc    Verify OTP and get reset token
 * @access  Public
 */
router.post(
  '/verify-otp',
  otpVerificationLimiter,
  verifyOTPValidation,
  handleValidationErrors,
  authController.verifyOTP
);

/**
 * @route   POST /api/accounts/reset-password
 * @desc    Reset user password with verified token
 * @access  Public
 */
router.post(
  '/reset-password',
  resetPasswordValidation,
  handleValidationErrors,
  authController.resetPassword
);

/**
 * @route   POST /api/accounts/token/refresh
 * @desc    Refresh access token
 * @access  Public
 */
router.post('/token/refresh', authController.refreshToken);

/**
 * @route   GET /api/accounts/profile
 * @desc    Get current user profile
 * @access  Private
 */
router.get('/profile', authenticate, authController.getProfile);

/**
 * @route   PUT /api/accounts/profile
 * @desc    Update user profile
 * @access  Private
 */
router.put('/profile', authenticate, authController.updateProfile);

/**
 * @route   POST /api/accounts/logout
 * @desc    Logout user
 * @access  Private
 */
router.post('/logout', authenticate, authController.logout);

module.exports = router;

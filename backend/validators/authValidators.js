const { body, param } = require('express-validator');
const { User } = require('../models');

/**
 * Validation rules for user registration
 */
const registerValidation = [
  body('email')
    .trim()
    .isEmail()
    .withMessage('Enter a valid email address.')
    .normalizeEmail()
    .custom(async (value) => {
      const existingUser = await User.findOne({ where: { email: value.toLowerCase() } });
      if (existingUser) {
        throw new Error('A user with this email already exists.');
      }
      return true;
    }),
  
  body('password')
    .isLength({ min: 8 })
    .withMessage('Password must be at least 8 characters long.')
    .matches(/[A-Za-z]/)
    .withMessage('Password must contain at least one letter.')
    .matches(/\d/)
    .withMessage('Password must contain at least one number.'),
  
  body('confirmPassword')
    .custom((value, { req }) => {
      if (value !== req.body.password) {
        throw new Error('Passwords do not match.');
      }
      return true;
    }),
  
  body('firstName')
    .trim()
    .notEmpty()
    .withMessage('First name is required.')
    .isLength({ max: 150 })
    .withMessage('First name must be less than 150 characters.'),
  
  body('lastName')
    .trim()
    .notEmpty()
    .withMessage('Last name is required.')
    .isLength({ max: 150 })
    .withMessage('Last name must be less than 150 characters.'),
  
  body('phoneNumber')
    .optional()
    .trim()
    .matches(/^[0-9\s\-\(\)]+$/)
    .withMessage('Enter a valid phone number.')
    .isLength({ min: 10, max: 20 })
    .withMessage('Phone number must be between 10 and 20 characters.'),
  
  body('userType')
    .optional()
    .isIn(['pet_owner', 'admin', 'staff'])
    .withMessage('Invalid user type.')
];

/**
 * Validation rules for user login
 */
const loginValidation = [
  body('email')
    .trim()
    .isEmail()
    .withMessage('Enter a valid email address.')
    .normalizeEmail(),
  
  body('password')
    .notEmpty()
    .withMessage('Password is required.')
];

/**
 * Validation rules for forgot password
 */
const forgotPasswordValidation = [
  body('email')
    .trim()
    .isEmail()
    .withMessage('Enter a valid email address.')
    .normalizeEmail()
];

/**
 * Validation rules for OTP verification
 */
const verifyOTPValidation = [
  body('email')
    .trim()
    .isEmail()
    .withMessage('Enter a valid email address.')
    .normalizeEmail(),
  
  body('otp')
    .notEmpty()
    .withMessage('OTP is required.')
    .isLength({ min: 6, max: 6 })
    .withMessage('OTP must be 6 digits.')
    .isNumeric()
    .withMessage('OTP must contain only numbers.')
];

/**
 * Validation rules for reset password
 */
const resetPasswordValidation = [
  body('token')
    .notEmpty()
    .withMessage('Reset token is required.')
    .isUUID()
    .withMessage('Invalid reset token format.'),
  
  body('newPassword')
    .isLength({ min: 8 })
    .withMessage('Password must be at least 8 characters long.')
    .matches(/[A-Za-z]/)
    .withMessage('Password must contain at least one letter.')
    .matches(/\d/)
    .withMessage('Password must contain at least one number.'),
  
  body('confirmPassword')
    .custom((value, { req }) => {
      if (value !== req.body.newPassword) {
        throw new Error('Passwords do not match.');
      }
      return true;
    })
];

module.exports = {
  registerValidation,
  loginValidation,
  forgotPasswordValidation,
  verifyOTPValidation,
  resetPasswordValidation
};

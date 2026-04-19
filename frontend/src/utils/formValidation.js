/**
 * Form Validation Utilities
 * Contains custom validation rules and schemas for all forms
 */

import * as Yup from 'yup';


// CUSTOM VALIDATION FUNCTIONS


/**
 * Validate Full Name - Only letters and spaces
 * @param {string} value - The name to validate
 * @returns {boolean|string} - True if valid, error message if invalid
 */
export const validateFullName = (value) => {
  if (!value || value.trim() === '') {
    return 'Full name is required.';
  }

  const trimmedValue = value.trim();

  // Must be at least 2 characters
  if (trimmedValue.length < 2) {
    return 'Full name must be at least 2 characters long.';
  }

  // Only letters (A-Z, a-z) and spaces allowed
  if (!/^[A-Za-z\s]+$/.test(trimmedValue)) {
    return 'Full name should contain only letters (A–Z).';
  }

  return true;
};

/**
 * Validate Email Address
 * @param {string} value - The email to validate
 * @returns {boolean|string} - True if valid, error message if invalid
 */
export const validateEmail = (value) => {
  if (!value) {
    return 'Email address is required.';
  }

  // Valid email format regex
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

  if (!emailRegex.test(value)) {
    return 'Please enter a valid email address (e.g., example@gmail.com).';
  }

  return true;
};

/**
 * Validate Password
 * Must be at least 8 characters and include uppercase, lowercase, number, and special character
 * @param {string} value - The password to validate
 * @returns {boolean|string} - True if valid, error message if invalid
 */
export const validatePassword = (value) => {
  if (!value) {
    return 'Password is required.';
  }

  // Regex: Min 8 chars, at least one uppercase, one lowercase, one digit, one special char
  const passwordRegex = /^(?=.*[A-Z])(?=.*[a-z])(?=.*\d)(?=.*[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?]).{8,}$/;

  if (!passwordRegex.test(value)) {
    return 'Password must be at least 8 characters and include uppercase, lowercase, number, and special character.';
  }

  return true;
};

/**
 * Validate Password Confirmation
 * @param {string} value - The password confirmation
 * @param {string} password - The original password
 * @returns {boolean|string} - True if valid, error message if invalid
 */
export const validatePasswordConfirmation = (value, password) => {
  if (!value) {
    return 'Please confirm your password.';
  }

  if (value !== password) {
    return 'Passwords do not match.';
  }

  return true;
};

/**
 * Validate Phone Number - Exactly 10 digits
 * @param {string} value - The phone number to validate
 * @returns {boolean|string} - True if valid, error message if invalid
 */
export const validatePhoneNumber = (value) => {
  if (!value) {
    return 'Phone number is required.';
  }

  // Remove any whitespace
  const cleanValue = value.replace(/\s/g, '');

  // Must contain only digits
  if (!/^\d+$/.test(cleanValue)) {
    return 'Phone number must contain only digits.';
  }

  // Must be exactly 10 digits
  if (cleanValue.length !== 10) {
    return 'Phone number must be exactly 10 digits.';
  }

  return true;
};

// ============================================
// YUP VALIDATION SCHEMAS
// ============================================

/**
 * Signup Form Validation Schema
 */
export const SignupValidationSchema = Yup.object().shape({
  first_name: Yup.string()
    .trim()
    .required('Full name is required.')
    .min(2, 'Full name must be at least 2 characters long.')
    .matches(/^[A-Za-z\s]+$/, 'Full name should contain only letters (A–Z).'),

  last_name: Yup.string()
    .trim()
    .required('Last name is required.')
    .min(2, 'Last name must be at least 2 characters long.')
    .matches(/^[A-Za-z\s]+$/, 'Last name should contain only letters (A–Z).'),

  email: Yup.string()
    .trim()
    .required('Email address is required.')
    .matches(
      /^[^\s@]+@[^\s@]+\.[^\s@]+$/,
      'Please enter a valid email address (e.g., example@gmail.com).'
    ),

  password: Yup.string()
    .required('Password is required.')
    .matches(
      /^(?=.*[A-Z])(?=.*[a-z])(?=.*\d)(?=.*[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?]).{8,}$/,
      'Password must be at least 8 characters and include uppercase, lowercase, number, and special character.'
    ),

  confirm_password: Yup.string()
    .required('Please confirm your password.')
    .oneOf([Yup.ref('password'), null], 'Passwords do not match.'),

  user_type: Yup.string()
    .oneOf(['pet_owner', 'admin', 'staff'], 'Invalid user type')
    .required('User type is required.'),

  terms: Yup.boolean()
    .oneOf([true], 'You must accept the terms and conditions.')
    .required('You must accept the terms and conditions.'),
});

/**
 * Login Form Validation Schema
 */
export const LoginValidationSchema = Yup.object().shape({
  email: Yup.string()
    .test('email', 'Please enter a valid email address (e.g., example@gmail.com).', function (value) {
      const result = validateEmail(value);
      return result === true ? true : this.createError({ message: result });
    })
    .required('Email address is required.'),

  password: Yup.string()
    .required('Password is required.')
    .min(8, 'Password must be at least 8 characters long.'),
});

/**
 * Forgot Password Form Validation Schema
 */
export const ForgotPasswordValidationSchema = Yup.object().shape({
  email: Yup.string()
    .test('email', 'Please enter a valid email address (e.g., example@gmail.com).', function (value) {
      const result = validateEmail(value);
      return result === true ? true : this.createError({ message: result });
    })
    .required('Email address is required.'),
});

/**
 * Reset Password Form Validation Schema
 */
export const ResetPasswordValidationSchema = Yup.object().shape({
  new_password: Yup.string()
    .test('password', 'Password is required.', function (value) {
      const result = validatePassword(value);
      return result === true ? true : this.createError({ message: result });
    })
    .required('Password is required.'),

  confirm_password: Yup.string()
    .test('confirm_password', 'Please confirm your password.', function (value) {
      const result = validatePasswordConfirmation(value, this.parent.new_password);
      return result === true ? true : this.createError({ message: result });
    })
    .required('Confirm password is required.'),
});

/**
 * Profile Update Form Validation Schema
 */
export const ProfileUpdateValidationSchema = Yup.object().shape({
  first_name: Yup.string()
    .test('fullname', 'Full name is required.', function (value) {
      const result = validateFullName(value);
      return result === true ? true : this.createError({ message: result });
    })
    .required('Full name is required.'),

  last_name: Yup.string()
    .min(2, 'Too short')
    .max(50, 'Too long')
    .required('Last name is required'),

  email: Yup.string()
    .test('email', 'Please enter a valid email address (e.g., example@gmail.com).', function (value) {
      const result = validateEmail(value);
      return result === true ? true : this.createError({ message: result });
    })
    .required('Email address is required.'),

  phone_number: Yup.string()
    .test('phone', 'Please enter a valid phone number.', function (value) {
      const result = validatePhoneNumber(value);
      return result === true ? true : this.createError({ message: result });
    })
    .nullable(),
});

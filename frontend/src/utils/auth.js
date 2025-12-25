/**
 * Authentication Utilities
 * 
 * Helper functions for managing JWT tokens and authentication state
 */

// Token storage keys
const ACCESS_TOKEN_KEY = 'pawwell_access_token';
const REFRESH_TOKEN_KEY = 'pawwell_refresh_token';
const USER_KEY = 'pawwell_user';

/**
 * Get access token from localStorage
 * @returns {string|null} Access token or null
 */
export const getAccessToken = () => {
  return localStorage.getItem(ACCESS_TOKEN_KEY);
};

/**
 * Get refresh token from localStorage
 * @returns {string|null} Refresh token or null
 */
export const getRefreshToken = () => {
  return localStorage.getItem(REFRESH_TOKEN_KEY);
};

/**
 * Set both access and refresh tokens in localStorage
 * @param {string} accessToken - JWT access token
 * @param {string} refreshToken - JWT refresh token
 */
export const setTokens = (accessToken, refreshToken) => {
  localStorage.setItem(ACCESS_TOKEN_KEY, accessToken);
  localStorage.setItem(REFRESH_TOKEN_KEY, refreshToken);
};

/**
 * Remove all tokens from localStorage
 */
export const removeTokens = () => {
  localStorage.removeItem(ACCESS_TOKEN_KEY);
  localStorage.removeItem(REFRESH_TOKEN_KEY);
  localStorage.removeItem(USER_KEY);
};

/**
 * Get user data from localStorage
 * @returns {Object|null} User object or null
 */
export const getUser = () => {
  const userStr = localStorage.getItem(USER_KEY);
  if (userStr) {
    try {
      return JSON.parse(userStr);
    } catch (error) {
      console.error('Error parsing user data:', error);
      return null;
    }
  }
  return null;
};

/**
 * Set user data in localStorage
 * @param {Object} user - User object
 */
export const setUser = (user) => {
  localStorage.setItem(USER_KEY, JSON.stringify(user));
};

/**
 * Check if user is authenticated
 * @returns {boolean} True if tokens exist, false otherwise
 */
export const isAuthenticated = () => {
  const accessToken = getAccessToken();
  const refreshToken = getRefreshToken();
  return !!(accessToken && refreshToken);
};

/**
 * Decode JWT token (without verification)
 * @param {string} token - JWT token
 * @returns {Object|null} Decoded token payload or null
 */
export const decodeToken = (token) => {
  try {
    const base64Url = token.split('.')[1];
    const base64 = base64Url.replace(/-/g, '+').replace(/_/g, '/');
    const jsonPayload = decodeURIComponent(
      atob(base64)
        .split('')
        .map((c) => '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2))
        .join('')
    );
    return JSON.parse(jsonPayload);
  } catch (error) {
    console.error('Error decoding token:', error);
    return null;
  }
};

/**
 * Check if token is expired
 * @param {string} token - JWT token
 * @returns {boolean} True if expired, false otherwise
 */
export const isTokenExpired = (token) => {
  if (!token) return true;
  
  const decoded = decodeToken(token);
  if (!decoded || !decoded.exp) return true;
  
  const currentTime = Date.now() / 1000;
  return decoded.exp < currentTime;
};

/**
 * Get token expiration time
 * @param {string} token - JWT token
 * @returns {Date|null} Expiration date or null
 */
export const getTokenExpiration = (token) => {
  const decoded = decodeToken(token);
  if (!decoded || !decoded.exp) return null;
  
  return new Date(decoded.exp * 1000);
};

/**
 * Validate password strength
 * @param {string} password - Password to validate
 * @returns {Object} Validation result with isValid and errors
 */
export const validatePassword = (password) => {
  const errors = [];
  
  if (password.length < 8) {
    errors.push('Password must be at least 8 characters long');
  }
  
  if (!/[A-Za-z]/.test(password)) {
    errors.push('Password must contain at least one letter');
  }
  
  if (!/\d/.test(password)) {
    errors.push('Password must contain at least one number');
  }
  
  return {
    isValid: errors.length === 0,
    errors
  };
};

/**
 * Get password strength score
 * @param {string} password - Password to evaluate
 * @returns {Object} Strength score and label
 */
export const getPasswordStrength = (password) => {
  let score = 0;
  
  if (!password) return { score: 0, label: 'None', color: '#ccc' };
  
  // Length
  if (password.length >= 8) score++;
  if (password.length >= 12) score++;
  
  // Contains lowercase
  if (/[a-z]/.test(password)) score++;
  
  // Contains uppercase
  if (/[A-Z]/.test(password)) score++;
  
  // Contains numbers
  if (/\d/.test(password)) score++;
  
  // Contains special characters
  if (/[^A-Za-z0-9]/.test(password)) score++;
  
  // Determine label and color
  if (score <= 2) {
    return { score, label: 'Weak', color: '#ff4d4f' };
  } else if (score <= 4) {
    return { score, label: 'Medium', color: '#faad14' };
  } else {
    return { score, label: 'Strong', color: '#52c41a' };
  }
};

/**
 * Validate email format
 * @param {string} email - Email to validate
 * @returns {boolean} True if valid, false otherwise
 */
export const validateEmail = (email) => {
  const emailRegex = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/;
  return emailRegex.test(email);
};

/**
 * Validate phone number format
 * @param {string} phone - Phone number to validate
 * @returns {boolean} True if valid, false otherwise
 */
export const validatePhone = (phone) => {
  if (!phone) return true; // Optional field
  
  const cleaned = phone.replace(/[\s\-()]/g, '');
  const phoneRegex = /^\+?[\d]{10,15}$/;
  return phoneRegex.test(cleaned);
};

/**
 * Format user display name
 * @param {Object} user - User object
 * @returns {string} Formatted name
 */
export const formatUserName = (user) => {
  if (!user) return '';
  
  if (user.full_name) return user.full_name;
  
  if (user.first_name && user.last_name) {
    return `${user.first_name} ${user.last_name}`;
  }
  
  if (user.first_name) return user.first_name;
  
  if (user.email) return user.email.split('@')[0];
  
  return 'User';
};

/**
 * Get user type display label
 * @param {string} userType - User type code
 * @returns {string} Display label
 */
export const getUserTypeLabel = (userType) => {
  const types = {
    'pet_owner': 'Pet Owner',
    'admin': 'Admin',
    'staff': 'Staff'
  };
  
  return types[userType] || userType;
};

/**
 * Handle API errors and extract error messages
 * @param {Object} error - Error object from API
 * @returns {string} Error message
 */
export const extractErrorMessage = (error) => {
  if (typeof error === 'string') return error;
  
  if (error.message) return error.message;
  
  if (error.errors) {
    // Handle validation errors (object with field errors)
    if (typeof error.errors === 'object') {
      const firstKey = Object.keys(error.errors)[0];
      const firstError = error.errors[firstKey];
      
      if (Array.isArray(firstError)) {
        return firstError[0];
      }
      
      return firstError;
    }
    
    return error.errors;
  }
  
  if (error.detail) return error.detail;
  
  return 'An unexpected error occurred';
};

/**
 * Format date for display
 * @param {string|Date} date - Date to format
 * @returns {string} Formatted date
 */
export const formatDate = (date) => {
  if (!date) return '';
  
  const d = new Date(date);
  const options = { year: 'numeric', month: 'long', day: 'numeric' };
  return d.toLocaleDateString('en-US', options);
};

/**
 * Format datetime for display
 * @param {string|Date} datetime - Datetime to format
 * @returns {string} Formatted datetime
 */
export const formatDateTime = (datetime) => {
  if (!datetime) return '';
  
  const d = new Date(datetime);
  const options = { 
    year: 'numeric', 
    month: 'long', 
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit'
  };
  return d.toLocaleDateString('en-US', options);
};

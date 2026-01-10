/**
 * API Service Configuration for PawWell Care Center
 * 
 * This module sets up axios with interceptors for authentication,
 * token refresh, and error handling.
 */

import axios from 'axios';
import { getAccessToken, getRefreshToken, setTokens, removeTokens } from '../utils/auth';

// Create axios instance with base configuration
const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL || 'http://localhost:8000/api',
  headers: {
    'Content-Type': 'application/json',
  },
  timeout: 10000, // 10 seconds
  withCredentials: true, // Send cookies with requests
});

console.log('🔧 API Service initialized with baseURL:', api.defaults.baseURL);

// Flag to prevent multiple refresh token requests
let isRefreshing = false;
let failedQueue = [];

const processQueue = (error, token = null) => {
  failedQueue.forEach(prom => {
    if (error) {
      prom.reject(error);
    } else {
      prom.resolve(token);
    }
  });
  
  failedQueue = [];
};

// Request interceptor - No need to attach token, cookies are sent automatically
api.interceptors.request.use(
  (config) => {
    console.log(`🌐 Making ${config.method.toUpperCase()} request to:`, config.baseURL + config.url);
    console.log('🍪 Cookies will be sent automatically');
    return config;
  },
  (error) => {
    console.error('❌ Request interceptor error:', error);
    return Promise.reject(error);
  }
);

// Response interceptor - Handle 401, 403 errors and token refresh
api.interceptors.response.use(
  (response) => {
    console.log(`✅ Response received from:`, response.config.url, '- Status:', response.status);
    return response;
  },
  async (error) => {
    console.error('❌ Response error:', {
      url: error.config?.url,
      status: error.response?.status,
      message: error.message,
      data: error.response?.data
    });
    
    const originalRequest = error.config;

    // Handle 403 Forbidden - Permission Denied
    if (error.response?.status === 403) {
      const errorData = error.response.data;
      
      // Check if it's an RBAC permission error
      if (errorData.code === 'INSUFFICIENT_PERMISSIONS' || 
          errorData.code === 'ADMIN_REQUIRED' || 
          errorData.code === 'OWNERSHIP_REQUIRED') {
        console.error('🚫 Permission Denied:', errorData.message);
        
        // You could dispatch an event or show a toast notification here
        if (typeof window !== 'undefined' && window.dispatchEvent) {
          window.dispatchEvent(new CustomEvent('permission-denied', {
            detail: {
              message: errorData.message,
              code: errorData.code,
              requiredRoles: errorData.requiredRoles,
              userRole: errorData.userRole
            }
          }));
        }
      }
      
      // Don't retry 403 errors, just reject
      return Promise.reject(error);
    }

    // If error is 401 and we haven't tried to refresh token yet
    if (error.response?.status === 401 && !originalRequest._retry) {
      if (isRefreshing) {
        // If already refreshing, queue this request
        return new Promise((resolve, reject) => {
          failedQueue.push({ resolve, reject });
        })
          .then(() => {
            return api(originalRequest);
          })
          .catch(err => {
            return Promise.reject(err);
          });
      }

      originalRequest._retry = true;
      isRefreshing = true;

      try {
        // Attempt to refresh token - cookies sent automatically
        const response = await axios.post(
          `${import.meta.env.VITE_API_URL || 'http://localhost:8000/api'}/accounts/token/refresh/`,
          {},
          { withCredentials: true }
        );

        if (response.data.success) {
          processQueue(null, null);
          return api(originalRequest);
        }
      } catch (refreshError) {
        processQueue(refreshError, null);
        removeTokens();
        window.location.href = '/login';
        return Promise.reject(refreshError);
      } finally {
        isRefreshing = false;
      }
    }

    return Promise.reject(error);
  }
);

// ==================== AUTH API FUNCTIONS ====================

/**
 * Register a new user
 * @param {Object} userData - User registration data
 * @returns {Promise} API response
 */
export const registerUser = async (userData) => {
  try {
    console.log('🌐 API: Sending registration request...', userData);
    const response = await api.post('/accounts/register', userData);
    console.log('🌐 API: Registration response received:', response.data);
    return response.data;
  } catch (error) {
    console.error('🌐 API: Registration error:', error.response?.data || error);
    throw error.response?.data || { message: 'Registration failed' };
  }
};

/**
 * Login user
 * @param {Object} credentials - Email and password
 * @returns {Promise} API response with user data (tokens in httpOnly cookies)
 */
export const loginUser = async (credentials) => {
  try {
    const response = await api.post('/accounts/login', credentials);
    
    // Tokens are now in httpOnly cookies, no need to store them
    // Just return the response
    return response.data;
  } catch (error) {
    throw error.response?.data || { message: 'Login failed' };
  }
};

/**
 * Request password reset OTP (new OTP-based flow)
 * @param {string} email - User's email address
 * @returns {Promise} API response
 */
export const requestPasswordResetOTP = async (email) => {
  try {
    const response = await api.post('/accounts/forgot-password', { email });
    return response.data;
  } catch (error) {
    throw error.response?.data || { message: 'Password reset request failed' };
  }
};

/**
 * Verify OTP and get reset token
 * @param {string} email - User's email address
 * @param {string} otp - 6-digit OTP code
 * @returns {Promise} API response with reset token
 */
export const verifyOTP = async (email, otp) => {
  try {
    const response = await api.post('/accounts/verify-otp', { email, otp });
    return response.data;
  } catch (error) {
    throw error.response?.data || { message: 'OTP verification failed' };
  }
};

/**
 * Request password reset (legacy)
 * @param {string} email - User's email address
 * @returns {Promise} API response
 */
export const forgotPassword = async (email) => {
  try {
    const response = await api.post('/accounts/forgot-password', { email });
    return response.data;
  } catch (error) {
    throw error.response?.data || { message: 'Password reset request failed' };
  }
};

/**
 * Reset password with token
 * @param {Object} data - Token, new password, and confirm password
 * @returns {Promise} API response
 */
export const resetPassword = async (data) => {
  try {
    console.log('🔍 API.JS: Reset password data received:', { ...data, newPassword: '***', confirmPassword: '***' });
    // Backend expects 'token' not 'resetToken'
    const payload = {
      token: data.resetToken,
      newPassword: data.newPassword,
      confirmPassword: data.confirmPassword
    };
    console.log('🔍 API.JS: Payload being sent:', { ...payload, newPassword: '***', confirmPassword: '***' });
    const response = await api.post('/accounts/reset-password', payload);
    return response.data;
  } catch (error) {
    throw error.response?.data || { message: 'Password reset failed' };
  }
};

/**
 * Refresh access token
 * @returns {Promise} API response with new access token
 */
export const refreshToken = async () => {
  try {
    const refresh = getRefreshToken();
    const response = await api.post('/accounts/token/refresh', { refresh });
    
    if (response.data.access) {
      setTokens(response.data.access, refresh);
    }
    
    return response.data;
  } catch (error) {
    removeTokens();
    throw error.response?.data || { message: 'Token refresh failed' };
  }
};

/**
 * Get current user profile
 * @returns {Promise} API response with user data
 */
export const getUserProfile = async () => {
  try {
    const response = await api.get('/accounts/profile');
    return response.data;
  } catch (error) {
    throw error.response?.data || { message: 'Failed to fetch user profile' };
  }
};

/**
 * Logout user
 * @returns {Promise} API response
 */
export const logoutUser = async () => {
  try {
    const refresh = getRefreshToken();
    const response = await api.post('/accounts/logout', { refresh });
    removeTokens();
    return response.data;
  } catch (error) {
    // Even if logout fails on backend, remove tokens locally
    removeTokens();
    throw error.response?.data || { message: 'Logout failed' };
  }
};

//  ADMIN API FUNCTIONS

/**
 * Get all users (Admin only)
 * @param {Object} params - Query parameters (page, limit, search, userType)
 * @returns {Promise} API response with users
 */
export const getAllUsers = async (params = {}) => {
  try {
    const response = await api.get('/admin/users', { params });
    return response.data;
  } catch (error) {
    throw error.response?.data || { message: 'Failed to fetch users' };
  }
};

/**
 * Get user by ID (Admin only)
 * @param {number} userId - User ID
 * @returns {Promise} API response with user data
 */
export const getUserById = async (userId) => {
  try {
    const response = await api.get(`/admin/users/${userId}`);
    return response.data;
  } catch (error) {
    throw error.response?.data || { message: 'Failed to fetch user' };
  }
};

/**
 * Update user (Admin only)
 * @param {number} userId - User ID
 * @param {Object} userData - Updated user data
 * @returns {Promise} API response
 */
export const updateUserById = async (userId, userData) => {
  try {
    const response = await api.put(`/admin/users/${userId}`, userData);
    return response.data;
  } catch (error) {
    throw error.response?.data || { message: 'Failed to update user' };
  }
};

/**
 * Delete user (Admin only)
 * @param {number} userId - User ID
 * @param {boolean} permanent - Whether to permanently delete
 * @returns {Promise} API response
 */
export const deleteUserById = async (userId, permanent = false) => {
  try {
    const response = await api.delete(`/admin/users/${userId}`, {
      params: { permanent }
    });
    return response.data;
  } catch (error) {
    throw error.response?.data || { message: 'Failed to delete user' };
  }
};

/**
 * Get all bookings (Admin only)
 * @returns {Promise} API response with all bookings
 */
export const getAllBookings = async () => {
  try {
    const response = await api.get('/admin/bookings');
    return response.data;
  } catch (error) {
    throw error.response?.data || { message: 'Failed to fetch bookings' };
  }
};

/**
 * Get system statistics (Admin only)
 * @returns {Promise} API response with system stats
 */
export const getSystemStats = async () => {
  try {
    const response = await api.get('/admin/stats');
    return response.data;
  } catch (error) {
    throw error.response?.data || { message: 'Failed to fetch system stats' };
  }
};

// ============================================
// PET PROFILE API ENDPOINTS
// ============================================

/**
 * Create a new pet profile
 * @param {FormData} formData - Pet data with photo
 * @returns {Promise} API response with created pet
 */
export const createPet = async (formData) => {
  try {
    const response = await api.post('/pets', formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    });
    return response.data;
  } catch (error) {
    throw error.response?.data || { message: 'Failed to create pet profile' };
  }
};

/**
 * Get all pets for the logged-in user
 * @returns {Promise} API response with pets array
 */
export const getUserPets = async () => {
  try {
    const response = await api.get('/pets');
    return response.data;
  } catch (error) {
    throw error.response?.data || { message: 'Failed to fetch pets' };
  }
};

/**
 * Get a specific pet by ID
 * @param {number} petId - Pet ID
 * @returns {Promise} API response with pet data
 */
export const getPetById = async (petId) => {
  try {
    const response = await api.get(`/pets/${petId}`);
    return response.data;
  } catch (error) {
    throw error.response?.data || { message: 'Failed to fetch pet' };
  }
};

/**
 * Update a pet profile
 * @param {number} petId - Pet ID
 * @param {FormData} formData - Updated pet data with optional photo
 * @returns {Promise} API response with updated pet
 */
export const updatePet = async (petId, formData) => {
  try {
    const response = await api.put(`/pets/${petId}`, formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    });
    return response.data;
  } catch (error) {
    throw error.response?.data || { message: 'Failed to update pet profile' };
  }
};

/**
 * Delete a pet profile
 * @param {number} petId - Pet ID
 * @returns {Promise} API response
 */
export const deletePet = async (petId) => {
  try {
    const response = await api.delete(`/pets/${petId}`);
    return response.data;
  } catch (error) {
    throw error.response?.data || { message: 'Failed to delete pet profile' };
  }
};

// ==================== BOOKING ENDPOINTS ====================

/**
 * Check availability for a booking
 * @param {object} data - Availability check data
 * @returns {Promise} Availability response
 */
export const checkAvailability = async (data) => {
  try {
    const response = await api.post('/bookings/check-availability', data);
    return response.data;
  } catch (error) {
    throw error.response?.data || { message: 'Failed to check availability' };
  }
};

/**
 * Create a new booking
 * @param {object} bookingData - Booking data
 * @returns {Promise} Created booking
 */
export const createBooking = async (bookingData) => {
  try {
    const response = await api.post('/bookings', bookingData);
    return response.data;
  } catch (error) {
    throw error.response?.data || { message: 'Failed to create booking' };
  }
};

/**
 * Get all bookings for the logged-in user
 * @param {object} filters - Optional filters
 * @returns {Promise} List of bookings
 */
export const getUserBookings = async (filters = {}) => {
  try {
    const params = new URLSearchParams();
    if (filters.status) params.append('status', filters.status);
    if (filters.upcoming) params.append('upcoming', 'true');
    if (filters.past) params.append('past', 'true');
    
    const response = await api.get(`/bookings${params.toString() ? '?' + params.toString() : ''}`);
    return response.data;
  } catch (error) {
    throw error.response?.data || { message: 'Failed to fetch bookings' };
  }
};

/**
 * Get a single booking by ID
 * @param {number} bookingId - Booking ID
 * @returns {Promise} Booking details
 */
export const getBookingById = async (bookingId) => {
  try {
    const response = await api.get(`/bookings/${bookingId}`);
    return response.data;
  } catch (error) {
    throw error.response?.data || { message: 'Failed to fetch booking' };
  }
};

/**
 * Update/Reschedule a booking
 * @param {number} bookingId - Booking ID
 * @param {object} updateData - Updated booking data
 * @returns {Promise} Updated booking
 */
export const updateBooking = async (bookingId, updateData) => {
  try {
    const response = await api.put(`/bookings/${bookingId}`, updateData);
    return response.data;
  } catch (error) {
    throw error.response?.data || { message: 'Failed to update booking' };
  }
};

/**
 * Cancel a booking
 * @param {number} bookingId - Booking ID
 * @returns {Promise} Cancelled booking
 */
export const cancelBooking = async (bookingId) => {
  try {
    const response = await api.delete(`/bookings/${bookingId}`);
    return response.data;
  } catch (error) {
    throw error.response?.data || { message: 'Failed to cancel booking' };
  }
};

/**
 * Admin: Get all pending bookings
 * @returns {Promise} List of pending bookings
 */
export const getPendingBookings = async () => {
  try {
    const response = await api.get('/bookings/admin/pending');
    return response.data;
  } catch (error) {
    throw error.response?.data || { message: 'Failed to fetch pending bookings' };
  }
};

/**
 * Admin: Approve a booking
 * @param {number} bookingId - Booking ID
 * @returns {Promise} Approved booking
 */
export const approveBooking = async (bookingId) => {
  try {
    const response = await api.put(`/bookings/admin/${bookingId}/approve`);
    return response.data;
  } catch (error) {
    throw error.response?.data || { message: 'Failed to approve booking' };
  }
};

/**
 * Admin: Reject a booking
 * @param {number} bookingId - Booking ID
 * @returns {Promise} Rejected booking
 */
export const rejectBooking = async (bookingId) => {
  try {
    const response = await api.put(`/bookings/admin/${bookingId}/reject`);
    return response.data;
  } catch (error) {
    throw error.response?.data || { message: 'Failed to reject booking' };
  }
};

/**
 * Admin: Get all bookings with filters
 * @param {object} filters - Optional filters
 * @returns {Promise} List of all bookings
 */
export const getAllBookingsAdmin = async (filters = {}) => {
  try {
    const params = new URLSearchParams();
    if (filters.status) params.append('status', filters.status);
    if (filters.service_type) params.append('service_type', filters.service_type);
    if (filters.date_from) params.append('date_from', filters.date_from);
    if (filters.date_to) params.append('date_to', filters.date_to);
    
    const response = await api.get(`/bookings/admin/all${params.toString() ? '?' + params.toString() : ''}`);
    return response.data;
  } catch (error) {
    throw error.response?.data || { message: 'Failed to fetch bookings' };
  }
};

export default api;

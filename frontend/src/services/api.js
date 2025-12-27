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
  baseURL: process.env.REACT_APP_API_URL || 'http://localhost:8000/api',
  headers: {
    'Content-Type': 'application/json',
  },
  timeout: 10000, // 10 seconds
});

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

// Request interceptor - Attach JWT token to headers
api.interceptors.request.use(
  (config) => {
    const token = getAccessToken();
    
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Response interceptor - Handle 401 errors and token refresh
api.interceptors.response.use(
  (response) => {
    return response;
  },
  async (error) => {
    const originalRequest = error.config;

    // If error is 401 and we haven't tried to refresh token yet
    if (error.response?.status === 401 && !originalRequest._retry) {
      if (isRefreshing) {
        // If already refreshing, queue this request
        return new Promise((resolve, reject) => {
          failedQueue.push({ resolve, reject });
        })
          .then(token => {
            originalRequest.headers.Authorization = `Bearer ${token}`;
            return api(originalRequest);
          })
          .catch(err => {
            return Promise.reject(err);
          });
      }

      originalRequest._retry = true;
      isRefreshing = true;

      const refreshToken = getRefreshToken();

      if (!refreshToken) {
        // No refresh token, redirect to login
        removeTokens();
        window.location.href = '/login';
        return Promise.reject(error);
      }

      try {
        // Attempt to refresh token
        const response = await axios.post(
          `${process.env.REACT_APP_API_URL || 'http://localhost:8000/api'}/accounts/token/refresh/`,
          { refresh: refreshToken }
        );

        const { access } = response.data;
        
        // Update tokens
        setTokens(access, refreshToken);
        
        // Update authorization header
        api.defaults.headers.common['Authorization'] = `Bearer ${access}`;
        originalRequest.headers.Authorization = `Bearer ${access}`;

        processQueue(null, access);
        
        return api(originalRequest);
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
 * @returns {Promise} API response with tokens and user data
 */
export const loginUser = async (credentials) => {
  try {
    const response = await api.post('/accounts/login', credentials);
    
    if (response.data.success) {
      // Store tokens
      setTokens(response.data.access, response.data.refresh);
    }
    
    return response.data;
  } catch (error) {
    throw error.response?.data || { message: 'Login failed' };
  }
};

/**
 * Request password reset
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
    const response = await api.post('/accounts/reset-password', data);
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

export default api;

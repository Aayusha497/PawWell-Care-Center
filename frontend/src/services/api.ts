/// <reference types="vite/client" />

/**
 * API Service Configuration for PawWell Care Center
 * 
 * This module sets up axios with interceptors for authentication,
 * token refresh, and error handling.
 */

import axios, { AxiosError } from 'axios';
import { getAccessToken, getRefreshToken, setTokens, removeTokens } from '../utils/auth';

// Create axios instance with base configuration
const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL || 'http://localhost:8000/api',
  headers: {
    'Content-Type': 'application/json',
  },
  timeout: 10000, // 10 seconds
});

console.log('🔧 API Service initialized with baseURL:', api.defaults.baseURL);

// Flag to prevent multiple refresh token requests
let isRefreshing = false;
let failedQueue: Array<{
  resolve: (value?: unknown) => void;
  reject: (reason?: unknown) => void;
}> = [];

const processQueue = (error: Error | null, token: string | null = null) => {
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
    console.log(`🌐 Making ${config.method?.toUpperCase()} request to:`, (config.baseURL || '') + config.url);
    
    const token = getAccessToken();
    
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
      console.log('🔑 Added Authorization token to request');
    }
    
    return config;
  },
  (error) => {
    console.error('❌ Request interceptor error:', error);
    return Promise.reject(error);
  }
);

// Response interceptor - Handle 401 errors and token refresh
api.interceptors.response.use(
  (response) => {
    console.log(`✅ Response received from:`, response.config.url, '- Status:', response.status);
    return response;
  },
  async (error: AxiosError) => {
    console.error('❌ Response error:', {
      url: error.config?.url,
      status: error.response?.status,
      message: error.message,
      data: error.response?.data
    });
    
    const originalRequest = error.config;

    if (!originalRequest) {
      return Promise.reject(error);
    }

    // If error is 401 and we haven't tried to refresh token yet
    if (error.response?.status === 401 && !(originalRequest as any)._retry) {
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

      (originalRequest as any)._retry = true;
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
          `${import.meta.env.VITE_API_URL || 'http://localhost:8000/api'}/accounts/token/refresh`,
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
        processQueue(refreshError as Error, null);
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

// ==================== TYPE DEFINITIONS ====================

export interface User {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
  fullName: string;
  phoneNumber?: string;
  userType: 'pet_owner' | 'veterinarian' | 'admin';
  emailVerified: boolean;
  isActive: boolean;
  lastLogin?: string;
  createdAt: string;
  updatedAt: string;
}

export interface RegisterData {
  email: string;
  password: string;
  confirmPassword: string;
  firstName: string;
  lastName: string;
  phoneNumber?: string;
  userType?: 'pet_owner' | 'veterinarian' | 'admin';
}

export interface LoginData {
  email: string;
  password: string;
}

export interface LoginResponse {
  success: boolean;
  message: string;
  access: string;
  refresh: string;
  user: User;
  accessTokenExpiry: string;
  refreshTokenExpiry: string;
}

export interface RegisterResponse {
  success: boolean;
  message: string;
  email: string;
}

export interface ApiError {
  success: boolean;
  message: string;
  errors?: Record<string, string[]>;
}

// ==================== AUTH API FUNCTIONS ====================

/**
 * Register a new user
 * @param {RegisterData} userData - User registration data
 * @returns {Promise<RegisterResponse>} API response
 */
export const registerUser = async (userData: RegisterData): Promise<RegisterResponse> => {
  try {
    console.log('🌐 API: Sending registration request...', userData);
    const response = await api.post('/accounts/register', userData);
    console.log('🌐 API: Registration response received:', response.data);
    return response.data;
  } catch (error) {
    console.error('🌐 API: Registration error:', (error as AxiosError).response?.data || error);
    throw (error as AxiosError).response?.data || { message: 'Registration failed' };
  }
};

/**
 * Login user
 * @param {LoginData} credentials - User login credentials
 * @returns {Promise<LoginResponse>} API response with tokens
 */
export const loginUser = async (credentials: LoginData): Promise<LoginResponse> => {
  try {
    console.log('🌐 API: Sending login request...');
    const response = await api.post('/accounts/login', credentials);
    console.log('🌐 API: Login response received:', response.data);
    
    // Store tokens
    const { access, refresh } = response.data;
    setTokens(access, refresh);
    
    return response.data;
  } catch (error) {
    console.error('🌐 API: Login error:', (error as AxiosError).response?.data || error);
    throw (error as AxiosError).response?.data || { message: 'Login failed' };
  }
};

/**
 * Logout user
 * @returns {Promise<any>} API response
 */
export const logoutUser = async (): Promise<any> => {
  try {
    console.log('🌐 API: Sending logout request...');
    const response = await api.post('/accounts/logout');
    console.log('🌐 API: Logout response received:', response.data);
    
    // Remove tokens
    removeTokens();
    
    return response.data;
  } catch (error) {
    console.error('🌐 API: Logout error:', (error as AxiosError).response?.data || error);
    // Remove tokens even if request fails
    removeTokens();
    throw (error as AxiosError).response?.data || { message: 'Logout failed' };
  }
};

/**
 * Get current user profile
 * @returns {Promise<any>} User profile data
 */
export const getProfile = async (): Promise<{ success: boolean; user: User }> => {
  try {
    console.log('🌐 API: Fetching user profile...');
    const response = await api.get('/accounts/profile');
    console.log('🌐 API: Profile response received:', response.data);
    return response.data;
  } catch (error) {
    console.error('🌐 API: Profile fetch error:', (error as AxiosError).response?.data || error);
    throw (error as AxiosError).response?.data || { message: 'Failed to fetch profile' };
  }
};

/**
 * Request password reset
 * @param {string} email - User email
 * @returns {Promise<any>} API response
 */
export const forgotPassword = async (email: string): Promise<any> => {
  try {
    console.log('🌐 API: Sending forgot password request...');
    const response = await api.post('/accounts/forgot-password', { email });
    console.log('🌐 API: Forgot password response received:', response.data);
    return response.data;
  } catch (error) {
    console.error('🌐 API: Forgot password error:', (error as AxiosError).response?.data || error);
    throw (error as AxiosError).response?.data || { message: 'Failed to send reset email' };
  }
};

/**
 * Request password reset OTP (new OTP-based flow)
 * @param {string} email - User's email address
 * @returns {Promise<any>} API response
 */
export const requestPasswordResetOTP = async (email: string): Promise<any> => {
  try {
    console.log('🌐 API: Requesting password reset OTP...');
    const response = await api.post('/accounts/forgot-password', { email });
    console.log('🌐 API: Password reset OTP response received:', response.data);
    return response.data;
  } catch (error) {
    console.error('🌐 API: Password reset OTP error:', (error as AxiosError).response?.data || error);
    throw (error as AxiosError).response?.data || { message: 'Failed to send OTP' };
  }
};

/**
 * Verify OTP and get reset token
 * @param {string} email - User's email address
 * @param {string} otp - 6-digit OTP code
 * @returns {Promise<any>} API response with reset token
 */
export const verifyOTP = async (email: string, otp: string): Promise<any> => {
  try {
    console.log('🌐 API: Verifying OTP...');
    const response = await api.post('/accounts/verify-otp', { email, otp });
    console.log('🌐 API: OTP verification response received:', response.data);
    return response.data;
  } catch (error) {
    console.error('🌐 API: OTP verification error:', (error as AxiosError).response?.data || error);
    throw (error as AxiosError).response?.data || { message: 'OTP verification failed' };
  }
};

/**
 * Reset password with token (legacy - two parameters)
 * @param {string} token - Password reset token
 * @param {string} newPassword - New password
 * @returns {Promise<any>} API response
 */
export const resetPasswordLegacy = async (token: string, newPassword: string): Promise<any> => {
  try {
    console.log('🌐 API: Sending reset password request (legacy)...');
    const response = await api.post('/accounts/reset-password', { token, newPassword });
    console.log('🌐 API: Reset password response received:', response.data);
    return response.data;
  } catch (error) {
    console.error('🌐 API: Reset password error:', (error as AxiosError).response?.data || error);
    throw (error as AxiosError).response?.data || { message: 'Failed to reset password' };
  }
};

/**
 * Reset password with data object (new OTP-based flow)
 * @param {Object} data - Contains resetToken, newPassword, and confirmPassword
 * @returns {Promise<any>} API response
 */
export const resetPassword = async (data: { resetToken: string; newPassword: string; confirmPassword: string }): Promise<any> => {
  try {
    console.log('🌐 API: Sending reset password request...');
    console.log('🔍 Reset token received:', data.resetToken);
    console.log('🔍 Reset token type:', typeof data.resetToken);
    console.log('🔍 Reset token length:', data.resetToken?.length);
    // Backend expects 'token' not 'resetToken'
    const payload = {
      token: data.resetToken,
      newPassword: data.newPassword,
      confirmPassword: data.confirmPassword
    };
    console.log('🔍 Payload being sent:', { ...payload, newPassword: '***', confirmPassword: '***' });
    const response = await api.post('/accounts/reset-password', payload);
    console.log('🌐 API: Reset password response received:', response.data);
    return response.data;
  } catch (error) {
    console.error('🌐 API: Reset password error:', (error as AxiosError).response?.data || error);
    throw (error as AxiosError).response?.data || { message: 'Failed to reset password' };
  }
};

/**
 * Refresh access token
 * @param {string} refreshToken - Refresh token
 * @returns {Promise<any>} New access token
 */
export const refreshAccessToken = async (refreshToken: string): Promise<any> => {
  try {
    console.log('🌐 API: Refreshing access token...');
    const response = await api.post('/accounts/token/refresh', { refresh: refreshToken });
    console.log('🌐 API: Token refresh response received');
    
    // Update stored access token
    const { access } = response.data;
    const currentRefresh = getRefreshToken();
    if (currentRefresh) {
      setTokens(access, currentRefresh);
    }
    
    return response.data;
  } catch (error) {
    console.error('🌐 API: Token refresh error:', (error as AxiosError).response?.data || error);
    throw (error as AxiosError).response?.data || { message: 'Failed to refresh token' };
  }
};

export default api;

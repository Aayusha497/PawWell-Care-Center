/// <reference types="vite/client" />

/**
 * API Service Configuration for PawWell Care Center
 * 
 * This module sets up axios with interceptors for authentication,
 * token refresh, and error handling.
 */

import axios, { AxiosError } from 'axios';
import { getAccessToken, getRefreshToken, setTokens, removeTokens } from '../utils/auth.ts';

// Create axios instance with base configuration
const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL || 'http://localhost:8000/api',
  headers: {
    'Content-Type': 'application/json',
  },
  timeout: 10000, // 10 seconds
  withCredentials: true, // Important for cookies
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
  address?: string;
  city?: string;
  emergencyContactNumber?: string;
  emergencyContactName?: string;
  profilePicture?: string;
  isProfileComplete?: boolean;
}

export interface UpdateProfileData {
  firstName?: string;
  lastName?: string;
  phoneNumber?: string;
  address?: string;
  city?: string;
  emergencyContactName?: string;
  emergencyContactNumber?: string;
  profilePicture?: string;
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
    
    // Tokens are automatically stored in httpOnly cookies by the backend
    // No need to manually store them
    
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
 * Update user profile
 * @param {UpdateProfileData | FormData} userData - Updated user data
 * @returns {Promise<any>} API response with updated user
 */
export const updateProfile = async (userData: UpdateProfileData | FormData): Promise<{ success: boolean; message: string; user: User }> => {
  try {
    console.log('🌐 API: Updating user profile...', userData);
    
    const config = userData instanceof FormData 
      ? { headers: { 'Content-Type': 'multipart/form-data' } }
      : {};

    const response = await api.put('/accounts/profile', userData, config);
    console.log('🌐 API: Update profile response received:', response.data);
    return response.data;
  } catch (error) {
    console.error('🌐 API: Update profile error:', (error as AxiosError).response?.data || error);
    throw (error as AxiosError).response?.data || { message: 'Failed to update profile' };
  }
};

/**
 * Delete user account
 * @returns {Promise<any>} API response with deletion confirmation
 */
export const deleteAccount = async (): Promise<{ success: boolean; message: string }> => {
  try {
    console.log('🌐 API: Deleting user account...');
    const response = await api.delete('/accounts/profile');
    console.log('🌐 API: Delete account response received:', response.data);
    return response.data;
  } catch (error) {
    console.error('🌐 API: Delete account error:', (error as AxiosError).response?.data || error);
    throw (error as AxiosError).response?.data || { message: 'Failed to delete account' };
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

/**
 * Pet Profile API Functions
 */

/**
 * Create a new pet profile
 * @param {FormData} formData - Pet data with photo
 * @returns {Promise<any>} API response with created pet
 */
export const createPet = async (formData: FormData): Promise<any> => {
  try {
    const response = await api.post('/pets', formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    });
    return response.data;
  } catch (error) {
    throw (error as AxiosError).response?.data || { message: 'Failed to create pet profile' };
  }
};

/**
 * Get all pets for the logged-in user
 * @returns {Promise<any>} API response with pets array
 */
export const getUserPets = async (): Promise<any> => {
  try {
    const response = await api.get('/pets');
    return response.data;
  } catch (error) {
    throw (error as AxiosError).response?.data || { message: 'Failed to fetch pets' };
  }
};

/**
 * Get a specific pet by ID
 * @param {number} petId - Pet ID
 * @returns {Promise<any>} API response with pet data
 */
export const getPetById = async (petId: number): Promise<any> => {
  try {
    const response = await api.get(`/pets/${petId}`);
    return response.data;
  } catch (error) {
    throw (error as AxiosError).response?.data || { message: 'Failed to fetch pet' };
  }
};

/**
 * Update a pet profile
 * @param {number} petId - Pet ID
 * @param {FormData} formData - Updated pet data with optional photo
 * @returns {Promise<any>} API response with updated pet
 */
export const updatePet = async (petId: number, formData: FormData): Promise<any> => {
  try {
    const response = await api.put(`/pets/${petId}`, formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    });
    return response.data;
  } catch (error) {
    throw (error as AxiosError).response?.data || { message: 'Failed to update pet profile' };
  }
};

/**
 * Delete a pet profile
 * @param {number} petId - Pet ID
 * @returns {Promise<any>} API response
 */
export const deletePet = async (petId: number): Promise<any> => {
  try {
    const response = await api.delete(`/pets/${petId}`);
    return response.data;
  } catch (error) {
    throw (error as AxiosError).response?.data || { message: 'Failed to delete pet profile' };
  }
};

//BOOKING API METHODS

/**
 * Check availability for a service on specific dates
 * @param {object} data - Availability check data
 * @returns {Promise<any>} Availability response
 */
export const checkAvailability = async (data: {
  service_type: string;
  start_date: string;
  end_date?: string;
}): Promise<any> => {
  try {
    const response = await api.post('/bookings/check-availability', data);
    return response.data;
  } catch (error) {
    throw (error as AxiosError).response?.data || { message: 'Failed to check availability' };
  }
};

/**
 * Create a new booking
 * @param {object} bookingData - Booking data
 * @returns {Promise<any>} Created booking
 */
export const createBooking = async (bookingData: {
  pet_id: number;
  service_type: string;
  start_date: string;
  end_date?: string;
  requires_pickup: boolean;
  pickup_address?: string;
  pickup_time?: string;
  dropoff_address?: string;
  dropoff_time?: string;
}): Promise<any> => {
  try {
    const response = await api.post('/bookings', bookingData);
    return response.data;
  } catch (error) {
    throw (error as AxiosError).response?.data || { message: 'Failed to create booking' };
  }
};

/**
 * Get all bookings for the logged-in user
 * @param {object} filters - Optional filters
 * @returns {Promise<any>} List of bookings
 */
export const getUserBookings = async (filters?: {
  status?: string;
  upcoming?: boolean;
  past?: boolean;
}): Promise<any> => {
  try {
    const params = new URLSearchParams();
    if (filters?.status) params.append('status', filters.status);
    if (filters?.upcoming) params.append('upcoming', 'true');
    if (filters?.past) params.append('past', 'true');
    
    const response = await api.get(`/bookings${params.toString() ? '?' + params.toString() : ''}`);
    return response.data;
  } catch (error) {
    throw (error as AxiosError).response?.data || { message: 'Failed to fetch bookings' };
  }
};

/**
 * Get a single booking by ID
 * @param {number} bookingId - Booking ID
 * @returns {Promise<any>} Booking details
 */
export const getBookingById = async (bookingId: number): Promise<any> => {
  try {
    const response = await api.get(`/bookings/${bookingId}`);
    return response.data;
  } catch (error) {
    throw (error as AxiosError).response?.data || { message: 'Failed to fetch booking' };
  }
};

/**
 * Update/Reschedule a booking
 * @param {number} bookingId - Booking ID
 * @param {object} updateData - Updated booking data
 * @returns {Promise<any>} Updated booking
 */
export const updateBooking = async (bookingId: number, updateData: {
  start_date?: string;
  end_date?: string;
  requires_pickup?: boolean;
  pickup_address?: string;
  pickup_time?: string;
  dropoff_address?: string;
  dropoff_time?: string;
}): Promise<any> => {
  try {
    const response = await api.put(`/bookings/${bookingId}`, updateData);
    return response.data;
  } catch (error) {
    throw (error as AxiosError).response?.data || { message: 'Failed to update booking' };
  }
};

/**
 * Cancel a booking
 * @param {number} bookingId - Booking ID
 * @returns {Promise<any>} Cancelled booking
 */
export const cancelBooking = async (bookingId: number): Promise<any> => {
  try {
    const response = await api.delete(`/bookings/${bookingId}`);
    return response.data;
  } catch (error) {
    throw (error as AxiosError).response?.data || { message: 'Failed to cancel booking' };
  }
};

/**
 * Admin: Get all pending bookings
 * @returns {Promise<any>} List of pending bookings
 */
export const getPendingBookings = async (): Promise<any> => {
  try {
    const response = await api.get('/bookings/admin/pending');
    return response.data;
  } catch (error) {
    throw (error as AxiosError).response?.data || { message: 'Failed to fetch pending bookings' };
  }
};

/**
 * Admin: Approve a booking
 * @param {number} bookingId - Booking ID
 * @returns {Promise<any>} Approved booking
 */
export const approveBooking = async (bookingId: number): Promise<any> => {
  try {
    const response = await api.put(`/bookings/admin/${bookingId}/approve`);
    return response.data;
  } catch (error) {
    throw (error as AxiosError).response?.data || { message: 'Failed to approve booking' };
  }
};

/**
 * Admin: Reject a booking
 * @param {number} bookingId - Booking ID
 * @returns {Promise<any>} Rejected booking
 */
export const rejectBooking = async (bookingId: number): Promise<any> => {
  try {
    const response = await api.put(`/bookings/admin/${bookingId}/reject`);
    return response.data;
  } catch (error) {
    throw (error as AxiosError).response?.data || { message: 'Failed to reject booking' };
  }
};

/**
 * Admin: Get all bookings with filters
 * @param {object} filters - Optional filters
 * @returns {Promise<any>} List of all bookings
 */
export const getAllBookingsAdmin = async (filters?: {
  status?: string;
  service_type?: string;
  date_from?: string;
  date_to?: string;
}): Promise<any> => {
  try {
    const params = new URLSearchParams();
    if (filters?.status) params.append('status', filters.status);
    if (filters?.service_type) params.append('service_type', filters.service_type);
    if (filters?.date_from) params.append('date_from', filters.date_from);
    if (filters?.date_to) params.append('date_to', filters.date_to);
    
    const response = await api.get(`/bookings/admin/all${params.toString() ? '?' + params.toString() : ''}`);
    return response.data;
  } catch (error) {
    throw (error as AxiosError).response?.data || { message: 'Failed to fetch bookings' };
  }
};

/**
 * Admin: Complete a booking
 * @param {number} bookingId - Booking ID
 * @returns {Promise<any>} Completed booking
 */
export const completeBooking = async (bookingId: number): Promise<any> => {
  try {
    const response = await api.put(`/bookings/admin/${bookingId}/complete`);
    return response.data;
  } catch (error) {
    throw (error as AxiosError).response?.data || { message: 'Failed to complete booking' };
  }
};

/**
 * Submit a contact message
 */
export const createContactMessage = async (data: {
  fullName: string;
  email: string;
  phoneNumber: string;
  location: string;
  subject: string;
  message: string;
}): Promise<any> => {
  try {
    const response = await api.post('/contact', data);
    return response.data;
  } catch (error: any) {
    throw error.response?.data || { message: 'Failed to send contact message' };
  }
};

/**
 * Admin: Get notification summary counts
 */
export const getAdminNotificationSummary = async (): Promise<any> => {
  try {
    const response = await api.get('/admin/notifications/summary');
    return response.data;
  } catch (error: any) {
    throw error.response?.data || { message: 'Failed to fetch notifications' };
  }
};

/**
 * Admin: Get contact messages
 */
export const getAdminContactMessages = async (filters?: {
  status?: 'unread' | 'read';
  page?: number;
  limit?: number;
}): Promise<any> => {
  try {
    const params = new URLSearchParams();
    if (filters?.status) params.append('status', filters.status);
    if (filters?.page) params.append('page', String(filters.page));
    if (filters?.limit) params.append('limit', String(filters.limit));

    const response = await api.get(`/admin/contact-messages${params.toString() ? '?' + params.toString() : ''}`);
    return response.data;
  } catch (error: any) {
    throw error.response?.data || { message: 'Failed to fetch contact messages' };
  }
};

/**
 * Admin: Mark all contact messages as read
 */
export const markAdminContactMessagesRead = async (): Promise<any> => {
  try {
    const response = await api.put('/admin/contact-messages/mark-read');
    return response.data;
  } catch (error: any) {
    throw error.response?.data || { message: 'Failed to update contact messages' };
  }
};

/**
 * Admin: Mark a contact message as read
 */
export const markAdminContactMessageRead = async (contactId: number): Promise<any> => {
  try {
    const response = await api.put(`/admin/contact-messages/${contactId}/read`);
    return response.data;
  } catch (error: any) {
    throw error.response?.data || { message: 'Failed to update contact message' };
  }
};

/**
 * Admin: Get emergency requests
 */
export const getAdminEmergencyRequests = async (status?: string): Promise<any> => {
  try {
    const params = status ? `?status=${encodeURIComponent(status)}` : '';
    const response = await api.get(`/emergency${params}`);
    return response.data;
  } catch (error: any) {
    throw error.response?.data || { message: 'Failed to fetch emergency requests' };
  }
};

/**
 * Create emergency request
 */
export const createEmergencyRequest = async (data: {
  pet_id: number;
  emergency_type: string;
  description: string;
  phone_number?: string;
  location?: string;
}): Promise<any> => {
  try {
    const response = await api.post('/emergency', data);
    return response.data;
  } catch (error: any) {
    throw error.response?.data || { message: 'Failed to submit emergency request' };
  }
};

/**
 * Get current user's emergency requests
 */
export const getMyEmergencyRequests = async (): Promise<any> => {
  try {
    const response = await api.get('/emergency/my');
    return response.data;
  } catch (error: any) {
    throw error.response?.data || { message: 'Failed to fetch emergency requests' };
  }
};

/**
 * Admin: Update emergency request status
 */
export const updateEmergencyStatus = async (emergencyId: number, status: string): Promise<any> => {
  try {
    const response = await api.patch(`/emergency/${emergencyId}/status`, { status });
    return response.data;
  } catch (error: any) {
    throw error.response?.data || { message: 'Failed to update emergency request' };
  }
};

// ==================== ACTIVITY LOG ENDPOINTS ====================

/**
 * Create a new activity log entry
 * @param {FormData} formData - Activity log data with optional photo
 * @returns {Promise<any>} API response with created activity log
 */
export const createActivityLog = async (formData: FormData): Promise<any> => {
  try {
    const response = await api.post('/activity-logs', formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    });
    return response.data;
  } catch (error) {
    throw (error as AxiosError).response?.data || { message: 'Failed to create activity log' };
  }
};

/**
 * Get activity logs with optional filters
 * @param {object} filters - Optional filters (pet_id, date, activity_type)
 * @returns {Promise<any>} API response with activity logs array
 */
export const getActivityLogs = async (filters: {
  pet_id?: string | number;
  date?: string;
  activity_type?: string;
} = {}): Promise<any> => {
  try {
    const params = new URLSearchParams();
    if (filters.pet_id) params.append('pet_id', String(filters.pet_id));
    if (filters.date) params.append('date', filters.date);
    if (filters.activity_type) params.append('activity_type', filters.activity_type);

    const response = await api.get(`/activity-logs${params.toString() ? '?' + params.toString() : ''}`);
    return response.data;
  } catch (error) {
    throw (error as AxiosError).response?.data || { message: 'Failed to fetch activity logs' };
  }
};

/**
 * Get all activity logs (admin endpoint)
 * @param {object} filters - Optional filters (pet_id, activity_type)
 * @returns {Promise<any>} API response with all activity logs array
 */
export const getAllActivityLogs = async (filters: {
  pet_id?: string | number;
  activity_type?: string;
} = {}): Promise<any> => {
  try {
    const params = new URLSearchParams();
    if (filters.pet_id) params.append('pet_id', String(filters.pet_id));
    if (filters.activity_type) params.append('activity_type', filters.activity_type);

    const response = await api.get(`/activity-logs/admin/all${params.toString() ? '?' + params.toString() : ''}`);
    return response.data;
  } catch (error) {
    throw (error as AxiosError).response?.data || { message: 'Failed to fetch activity logs' };
  }
};

/**
 * Update an activity log
 * @param {number} activityLogId - Activity log ID
 * @param {FormData} formData - Updated activity log data (same format as create)
 * @returns {Promise<any>} API response with updated activity log
 */
export const updateActivityLog = async (activityLogId: number, formData: FormData): Promise<any> => {
  try {
    const response = await api.put(`/activity-logs/${activityLogId}`, formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    });
    return response.data;
  } catch (error) {
    throw (error as AxiosError).response?.data || { message: 'Failed to update activity log' };
  }
};

/**
 * Delete an activity log
 * @param {number} activityLogId - Activity log ID to delete
 * @returns {Promise<any>} API response confirming deletion
 */
export const deleteActivityLog = async (activityLogId: number): Promise<any> => {
  try {
    const response = await api.delete(`/activity-logs/${activityLogId}`);
    return response.data;
  } catch (error) {
    throw (error as AxiosError).response?.data || { message: 'Failed to delete activity log' };
  }
};

// WELLNESS TIMELINE 

/**
 * Get wellness timeline entries for a pet
 * @param {string | number} petId - Pet ID
 * @returns {Promise<any>} List of timeline entries
 */
export const getTimelineEntries = async (petId: string | number): Promise<any> => {
  try {
    const response = await api.get(`/wellness-timeline?pet_id=${petId}`);
    return response.data;
  } catch (error) {
    throw (error as AxiosError).response?.data || { message: 'Failed to fetch timeline entries' };
  }
};

/**
 * Create a new timeline entry
 * @param {object} data - Timeline entry data
 * @returns {Promise<any>} Created entry
 */
export const createTimelineEntry = async (data: {
  pet_id: string | number;
  date: string;
  type: string;
  title: string;
  description?: string;
  next_due_date?: string;
}): Promise<any> => {
  try {
    const response = await api.post('/wellness-timeline', data);
    return response.data;
  } catch (error) {
    throw (error as AxiosError).response?.data || { message: 'Failed to create timeline entry' };
  }
};

/**
 * Get a single timeline entry
 * @param {string | number} id - Timeline entry ID
 * @returns {Promise<any>} Timeline entry details
 */
export const getTimelineEntry = async (id: string | number): Promise<any> => {
  try {
    const response = await api.get(`/wellness-timeline/${id}`);
    return response.data;
  } catch (error) {
    throw (error as AxiosError).response?.data || { message: 'Failed to fetch timeline entry' };
  }
};

/**
 * Update a timeline entry
 * @param {string | number} id - Timeline entry ID
 * @param {object} data - Updated data
 * @returns {Promise<any>} Updated entry
 */
export const updateTimelineEntry = async (id: string | number, data: {
  date?: string; // string for input compatibility
  type?: string;
  title?: string;
  description?: string;
  next_due_date?: string | null;
}): Promise<any> => {
  try {
    const response = await api.put(`/wellness-timeline/${id}`, data);
    return response.data;
  } catch (error) {
    throw (error as AxiosError).response?.data || { message: 'Failed to update timeline entry' };
  }
};

/**
 * Delete a timeline entry
 * @param {string | number} id - Timeline entry ID
 * @returns {Promise<any>} Deletion confirmation
 */
export const deleteTimelineEntry = async (id: string | number): Promise<any> => {
  try {
    const response = await api.delete(`/wellness-timeline/${id}`);
    return response.data;
  } catch (error) {
    throw (error as AxiosError).response?.data || { message: 'Failed to delete timeline entry' };
  }
};

// ================================
// NOTIFICATION ENDPOINTS
// ================================

/**
 * Get all notifications for the current user
 * @returns {Promise<{notifications: any[], unreadCount: number}>} Notifications and unread count
 */
export const getNotifications = async (): Promise<{ notifications: any[]; unreadCount: number }> => {
  try {
    const response = await api.get('/notifications');
    return response.data.data;
  } catch (error) {
    throw (error as AxiosError).response?.data || { message: 'Failed to fetch notifications' };
  }
};

/**
 * Mark a notification as read
 * @param {string | number} id - Notification ID
 * @returns {Promise<any>} Updated notification
 */
export const markNotificationAsRead = async (id: string | number): Promise<any> => {
  try {
    const response = await api.patch(`/notifications/${id}/read`);
    return response.data;
  } catch (error) {
    throw (error as AxiosError).response?.data || { message: 'Failed to mark notification as read' };
  }
};

/**
 * Mark all notifications as read
 * @returns {Promise<any>} Update confirmation
 */
export const markAllNotificationsAsRead = async (): Promise<any> => {
  try {
    const response = await api.patch('/notifications/mark-all-read');
    return response.data;
  } catch (error) {
    throw (error as AxiosError).response?.data || { message: 'Failed to mark all notifications as read' };
  }
};

/**
 * Delete a notification
 * @param {string | number} id - Notification ID
 * @returns {Promise<any>} Deletion confirmation
 */
export const deleteNotification = async (id: string | number): Promise<any> => {
  try {
    const response = await api.delete(`/notifications/${id}`);
    return response.data;
  } catch (error) {
    throw (error as AxiosError).response?.data || { message: 'Failed to delete notification' };
  }
};

// ================================
// Review APIs
// ================================

/**
 * Create a new review
 * @param {FormData} reviewData - Review data including ratings and optional photo
 * @returns {Promise<any>} Created review
 */
export const createReview = async (reviewData: FormData): Promise<any> => {
  try {
    const response = await api.post('/reviews', reviewData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    });
    return response.data;
  } catch (error) {
    throw (error as AxiosError).response?.data || { message: 'Failed to create review' };
  }
};

/**
 * Get all approved reviews (public)
 * @param {object} params - Query parameters (service_type, min_rating, page, limit, featured)
 * @returns {Promise<any>} Paginated reviews
 */
export const getReviews = async (params: {
  service_type?: string;
  min_rating?: number;
  page?: number;
  limit?: number;
  featured?: boolean;
} = {}): Promise<any> => {
  try {
    const queryParams = new URLSearchParams();
    if (params.service_type) queryParams.append('service_type', params.service_type);
    if (params.min_rating) queryParams.append('min_rating', String(params.min_rating));
    if (params.page) queryParams.append('page', String(params.page));
    if (params.limit) queryParams.append('limit', String(params.limit));
    if (params.featured) queryParams.append('featured', 'true');

    const url = `/reviews${queryParams.toString() ? '?' + queryParams.toString() : ''}`;
    console.log('🔍 API: Fetching reviews from:', url);
    console.log('🔍 API: Request params:', params);
    
    const response = await api.get(url);
    console.log('✅ API: Reviews response received:', response.data);
    console.log('✅ API: Reviews count:', response.data?.data?.length || 0);
    
    return response.data;
  } catch (error) {
    console.error('❌ API: Error fetching reviews:', error);
    throw (error as AxiosError).response?.data || { message: 'Failed to fetch reviews' };
  }
};

/**
 * Get review statistics
 * @returns {Promise<any>} Review statistics (averages, distribution)
 */
export const getReviewStats = async (): Promise<any> => {
  try {
    const response = await api.get('/reviews/stats');
    return response.data;
  } catch (error) {
    throw (error as AxiosError).response?.data || { message: 'Failed to fetch review statistics' };
  }
};

/**
 * Get current user's reviews
 * @returns {Promise<any>} User's reviews
 */
export const getMyReviews = async (): Promise<any> => {
  try {
    const response = await api.get('/reviews/my-reviews');
    return response.data;
  } catch (error) {
    throw (error as AxiosError).response?.data || { message: 'Failed to fetch your reviews' };
  }
};

/**
 * Get completed bookings that can be reviewed
 * @returns {Promise<any>} Reviewable bookings
 */
export const getReviewableBookings = async (): Promise<any> => {
  try {
    const response = await api.get('/reviews/reviewable-bookings');
    return response.data;
  } catch (error) {
    throw (error as AxiosError).response?.data || { message: 'Failed to fetch reviewable bookings' };
  }
};

/**
 * Update a review
 * @param {string | number} id - Review ID
 * @param {FormData} reviewData - Updated review data
 * @returns {Promise<any>} Updated review
 */
export const updateReview = async (id: string | number, reviewData: FormData): Promise<any> => {
  try {
    const response = await api.put(`/reviews/${id}`, reviewData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    });
    return response.data;
  } catch (error) {
    throw (error as AxiosError).response?.data || { message: 'Failed to update review' };
  }
};

/**
 * Delete a review
 * @param {string | number} id - Review ID
 * @returns {Promise<any>} Deletion confirmation
 */
export const deleteReview = async (id: string | number): Promise<any> => {
  try {
    const response = await api.delete(`/reviews/${id}`);
    return response.data;
  } catch (error) {
    throw (error as AxiosError).response?.data || { message: 'Failed to delete review' };
  }
};

/**
 * Get all reviews (admin) including unapproved
 * @param {object} params - Query parameters (page, limit, status)
 * @returns {Promise<any>} All reviews
 */
export const getAllReviews = async (params: {
  page?: number;
  limit?: number;
  status?: string;
} = {}): Promise<any> => {
  try {
    const queryParams = new URLSearchParams();
    if (params.page) queryParams.append('page', String(params.page));
    if (params.limit) queryParams.append('limit', String(params.limit));
    if (params.status) queryParams.append('status', params.status);

    const response = await api.get(`/reviews/admin/all${queryParams.toString() ? '?' + queryParams.toString() : ''}`);
    return response.data;
  } catch (error) {
    throw (error as AxiosError).response?.data || { message: 'Failed to fetch all reviews' };
  }
};

/**
 * Approve/reject or feature a review (admin)
 * @param {string | number} id - Review ID
 * @param {object} data - Approval data (is_approved, is_featured, admin_response)
 * @returns {Promise<any>} Updated review
 */
export const approveReview = async (id: string | number, data: {
  is_approved?: boolean;
  is_featured?: boolean;
  admin_response?: string;
}): Promise<any> => {
  try {
    const response = await api.patch(`/reviews/${id}/approve`, data);
    return response.data;
  } catch (error) {
    throw (error as AxiosError).response?.data || { message: 'Failed to update review approval' };
  }
};

export default api;



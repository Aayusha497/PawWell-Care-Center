/**
 * Authentication utility functions
 * Handles token storage and retrieval from localStorage
 */

const ACCESS_TOKEN_KEY = 'pawwell_access_token';
const REFRESH_TOKEN_KEY = 'pawwell_refresh_token';
const USER_DATA_KEY = 'pawwell_user_data';

/**
 * Store authentication tokens
 * @param {string} accessToken - JWT access token
 * @param {string} refreshToken - JWT refresh token
 */
export const setTokens = (accessToken: string, refreshToken: string): void => {
  try {
    localStorage.setItem(ACCESS_TOKEN_KEY, accessToken);
    localStorage.setItem(REFRESH_TOKEN_KEY, refreshToken);
    console.log('🔐 Tokens stored successfully');
  } catch (error) {
    console.error('❌ Error storing tokens:', error);
  }
};

/**
 * Get access token from storage
 * @returns {string | null} Access token or null if not found
 */
export const getAccessToken = (): string | null => {
  try {
    return localStorage.getItem(ACCESS_TOKEN_KEY);
  } catch (error) {
    console.error('❌ Error retrieving access token:', error);
    return null;
  }
};

/**
 * Get refresh token from storage
 * @returns {string | null} Refresh token or null if not found
 */
export const getRefreshToken = (): string | null => {
  try {
    return localStorage.getItem(REFRESH_TOKEN_KEY);
  } catch (error) {
    console.error('❌ Error retrieving refresh token:', error);
    return null;
  }
};

/**
 * Remove all authentication tokens
 */
export const removeTokens = (): void => {
  try {
    localStorage.removeItem(ACCESS_TOKEN_KEY);
    localStorage.removeItem(REFRESH_TOKEN_KEY);
    localStorage.removeItem(USER_DATA_KEY);
    console.log('🔓 Tokens removed successfully');
  } catch (error) {
    console.error('❌ Error removing tokens:', error);
  }
};

/**
 * Check if user is authenticated
 * @returns {boolean} True if access token exists
 */
export const isAuthenticated = (): boolean => {
  const token = getAccessToken();
  return !!token;
};

/**
 * Store user data
 * @param {any} userData - User data object
 */
export const setUserData = (userData: any): void => {
  try {
    localStorage.setItem(USER_DATA_KEY, JSON.stringify(userData));
    console.log('👤 User data stored successfully');
  } catch (error) {
    console.error('❌ Error storing user data:', error);
  }
};

/**
 * Get user data from storage
 * @returns {any | null} User data or null if not found
 */
export const getUserData = (): any | null => {
  try {
    const data = localStorage.getItem(USER_DATA_KEY);
    return data ? JSON.parse(data) : null;
  } catch (error) {
    console.error('❌ Error retrieving user data:', error);
    return null;
  }
};

/**
 * Clear all user data
 */
export const clearUserData = (): void => {
  removeTokens();
};

/**
 * Decode JWT token (without verification)
 * @param {string} token - JWT token
 * @returns {any | null} Decoded token payload or null if invalid
 */
export const decodeToken = (token: string): any | null => {
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
    console.error('❌ Error decoding token:', error);
    return null;
  }
};

/**
 * Check if token is expired
 * @param {string} token - JWT token
 * @returns {boolean} True if token is expired
 */
export const isTokenExpired = (token: string): boolean => {
  try {
    const decoded = decodeToken(token);
    if (!decoded || !decoded.exp) {
      return true;
    }
    
    const currentTime = Date.now() / 1000;
    return decoded.exp < currentTime;
  } catch (error) {
    console.error('❌ Error checking token expiration:', error);
    return true;
  }
};

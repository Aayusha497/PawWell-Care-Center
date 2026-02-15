/**
 * Authentication utility functions
 * Handles user data storage. Tokens are handled via HttpOnly cookies.
 */

const USER_DATA_KEY = 'pawwell_user_data';
// Keeping these constants to avoid breaking legacy code if referenced, though they shouldn't be used
const ACCESS_TOKEN_KEY = 'pawwell_access_token';
const REFRESH_TOKEN_KEY = 'pawwell_refresh_token';

/**
 * Store user data
 * @param {object} user - User object
 */
export const setUserData = (user: any): void => {
  try {
    localStorage.setItem(USER_DATA_KEY, JSON.stringify(user));
  } catch (error) {
    console.error('❌ Error storing user data:', error);
  }
};

/**
 * Get user data from storage
 * @returns {object | null} User object or null
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
 * Clear user data from storage
 */
export const clearUserData = (): void => {
  try {
    localStorage.removeItem(USER_DATA_KEY);
    // Also clean up legacy tokens if they exist
    localStorage.removeItem(ACCESS_TOKEN_KEY);
    localStorage.removeItem(REFRESH_TOKEN_KEY);
  } catch (error) {
    console.error('❌ Error clearing user data:', error);
  }
};

/**
 * Check if user is authenticated (based on local user data existence)
 * reliable verification requires backend call
 * @returns {boolean}
 */
export const isAuthenticated = (): boolean => {
  return !!getUserData();
};

/**
 * @deprecated Tokens are now in httpOnly cookies
 */
export const setTokens = (accessToken: string, refreshToken: string): void => {
  // No-op
};

/**
 * @deprecated Tokens are now in httpOnly cookies
 */
export const getAccessToken = (): string | null => {
  return null;
};

/**
 * @deprecated Tokens are now in httpOnly cookies
 */
export const getRefreshToken = (): string | null => {
  return null;
};

/**
 * Remove all authentication tokens (Legacy wrapper)
 */
export const removeTokens = (): void => {
  clearUserData();
};

/**
 * Decode JWT token
 * @param {string} token - JWT token
 * @returns {any | null} Decoded token payload or null if invalid
 */
export const decodeToken = (token: string): any | null => {
  try {
    if (!token) return null;
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

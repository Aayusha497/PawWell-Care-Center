/**
 * Authentication Context
 * 
 * Manages global authentication state and provides auth functions
 * to the entire application
 */

import React, { createContext, useState, useContext, useEffect, useCallback } from 'react';
import { getUserProfile, loginUser, registerUser } from '../services/api';
import { 
  isAuthenticated, 
  setUser as saveUser, 
  removeTokens,
  setTokens
} from '../utils/auth';

const AuthContext = createContext(null);

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [isAuth, setIsAuth] = useState(false);

  /**
   * Load user data from API if tokens exist
   */
  const loadUser = useCallback(async () => {
    if (!isAuthenticated()) {
      setLoading(false);
      setIsAuth(false);
      return;
    }

    try {
      const response = await getUserProfile();
      
      if (response.success && response.user) {
        setUser(response.user);
        saveUser(response.user);
        setIsAuth(true);
      } else {
        // Invalid session, clear tokens
        removeTokens();
        setUser(null);
        setIsAuth(false);
      }
    } catch (error) {
      console.error('Error loading user:', error);
      // If token is invalid, clear everything
      removeTokens();
      setUser(null);
      setIsAuth(false);
    } finally {
      setLoading(false);
    }
  }, []);

  /**
   * Load user on component mount
   */
  useEffect(() => {
    loadUser();
  }, [loadUser]);

  /**
   * Login function
   * @param {Object} credentials - Email and password
   * @returns {Promise} API response
   */
  const login = useCallback(async (credentials) => {
    try {
      setLoading(true);
      const response = await loginUser(credentials);
      
      if (response.success && response.user) {
        setUser(response.user);
        saveUser(response.user);
        setIsAuth(true);
        return response;
      } else {
        throw new Error(response.message || 'Login failed');
      }
    } catch (error) {
      setIsAuth(false);
      throw error;
    } finally {
      setLoading(false);
    }
  }, []);

  /**
   * Register function
   * @param {Object} userData - User registration data
   * @returns {Promise} API response
   */
  const register = useCallback(async (userData) => {
    try {
      setLoading(true);
      const response = await registerUser(userData);
      
      if (response.success) {
        return response;
      } else {
        throw new Error(response.message || 'Registration failed');
      }
    } catch (error) {
      throw error;
    } finally {
      setLoading(false);
    }
  }, []);

  /**
   * Logout function
   */
  const logout = useCallback(() => {
    removeTokens();
    setUser(null);
    setIsAuth(false);
  }, []);

  /**
   * Update user data
   * @param {Object} userData - Updated user data
   */
  const updateUser = useCallback((userData) => {
    setUser(userData);
    saveUser(userData);
  }, []);

  /**
   * Check if user is authenticated
   * @returns {boolean}
   */
  const checkAuth = useCallback(() => {
    return isAuthenticated() && user !== null;
  }, [user]);

  const value = {
    user,
    loading,
    isAuthenticated: isAuth,
    isLoggedIn: isAuth,
    login,
    register,
    logout,
    updateUser,
    checkAuth,
    refreshUser: loadUser
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
};

export default AuthContext;

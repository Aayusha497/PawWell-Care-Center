import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { 
  loginUser, 
  registerUser, 
  logoutUser, 
  getProfile,
  type User,
  type LoginData,
  type RegisterData,
  type LoginResponse,
  type RegisterResponse
} from '../services/api';
import { 
  isAuthenticated, 
  getUserData, 
  setUserData, 
  clearUserData,
  getAccessToken
} from '../utils/auth.ts';

interface AuthContextType {
  user: User | null;
  loading: boolean;
  error: string | null;
  login: (credentials: LoginData) => Promise<LoginResponse>;
  register: (userData: RegisterData) => Promise<RegisterResponse>;
  logout: () => Promise<void>;
  refreshUserProfile: () => Promise<void>;
  isLoggedIn: boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

interface AuthProviderProps {
  children: ReactNode;
}

export const AuthProvider: React.FC<AuthProviderProps> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Initialize auth state on mount
  useEffect(() => {
    const initializeAuth = async () => {
      try {
        console.log('🔐 Initializing authentication...');
        
        // Check if user is authenticated
        if (isAuthenticated()) {
          // Try to get user data from localStorage first
          const storedUser = getUserData();
          
          if (storedUser) {
            console.log('👤 Found stored user data:', storedUser);
            setUser(storedUser);
          }
          
          // Verify with backend and get fresh profile
          try {
            const response = await getProfile();
            console.log('✅ Profile fetched successfully:', response.user);
            setUser(response.user);
            setUserData(response.user);
          } catch (profileError) {
            console.warn('⚠️ Could not fetch profile, using stored data:', profileError);
            // If profile fetch fails but we have stored data, keep using it
            if (!storedUser) {
              clearUserData();
              setUser(null);
            }
          }
        } else {
          console.log('🔓 No authentication token found');
        }
      } catch (error) {
        console.error('❌ Auth initialization error:', error);
        clearUserData();
        setUser(null);
      } finally {
        setLoading(false);
      }
    };

    initializeAuth();
  }, []);

  const login = async (credentials: LoginData): Promise<LoginResponse> => {
    try {
      setLoading(true);
      setError(null);
      console.log('🔐 Attempting login...');
      
      const response = await loginUser(credentials);
      
      console.log('✅ Login successful:', response.user);
      setUser(response.user);
      setUserData(response.user);
      
      return response;
    } catch (err: any) {
      console.error('❌ Login error:', err);
      const errorMessage = err.message || 'Login failed';
      setError(errorMessage);
      throw err;
    } finally {
      setLoading(false);
    }
  };

  const register = async (userData: RegisterData): Promise<RegisterResponse> => {
    try {
      setLoading(true);
      setError(null);
      console.log('📝 Attempting registration...');
      
      const response = await registerUser(userData);
      
      console.log('✅ Registration successful:', response);
      
      return response;
    } catch (err: any) {
      console.error('❌ Registration error:', err);
      const errorMessage = err.message || 'Registration failed';
      setError(errorMessage);
      throw err;
    } finally {
      setLoading(false);
    }
  };

  const logout = async (): Promise<void> => {
    try {
      setLoading(true);
      console.log('🔓 Logging out...');
      
      await logoutUser();
      
      setUser(null);
      clearUserData();
      
      console.log('✅ Logout successful');
    } catch (err: any) {
      console.error('❌ Logout error:', err);
      // Clear local data even if API call fails
      setUser(null);
      clearUserData();
    } finally {
      setLoading(false);
    }
  };

  const refreshUserProfile = async (): Promise<void> => {
    try {
      console.log('🔄 Refreshing user profile...');
      const response = await getProfile();
      setUser(response.user);
      setUserData(response.user);
      console.log('✅ Profile refreshed successfully');
    } catch (err: any) {
      console.error('❌ Profile refresh error:', err);
      throw err;
    }
  };

  const value: AuthContextType = {
    user,
    loading,
    error,
    login,
    register,
    logout,
    refreshUserProfile,
    isLoggedIn: !!user && isAuthenticated(),
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

export default AuthContext;

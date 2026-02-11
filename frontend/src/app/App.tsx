import { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { ROLES, isAdmin } from '../utils/rbac';
import LandingPage from './components/LandingPage';
import LoginPage from './components/LoginPage';
import SignupPage from './components/SignupPage';
import ForgotPasswordPage from './components/ForgotPasswordPage';
import VerifyOTPPage from './components/VerifyOTPPage';
import ResetPasswordPage from './components/ResetPasswordPage';
import UserDashboard from './components/UserDashboard';
import AdminDashboard from './components/AdminDashboard';
import PermissionDenied from '../components/PermissionDenied';
import { Toaster } from './components/ui/sonner';
import { toast } from 'sonner';
import type { LoginData, RegisterData } from '../services/api';

type Page = 'landing' | 'login' | 'signup' | 'forgot-password' | 'verify-otp' | 'reset-password' | 'user-dashboard' | 'admin-dashboard' | 'permission-denied';

export default function App() {
  const { user, login, register, logout, loading, isLoggedIn } = useAuth();
  const [currentPage, setCurrentPage] = useState<Page>('landing');
  const [error, setError] = useState<string | null>(null);
  const [fieldErrors, setFieldErrors] = useState<Record<string, string[]>>({});
  const [forgotPasswordEmail, setForgotPasswordEmail] = useState('');
  const [resetToken, setResetToken] = useState('');

  // Redirect authenticated users to appropriate dashboard
  useEffect(() => {
    if (isLoggedIn && user) {
      if (user.userType === 'admin') {
        setCurrentPage('admin-dashboard');
      } else {
        setCurrentPage('user-dashboard');
      }
    }
  }, [isLoggedIn, user]);

  // Show loading spinner while checking authentication (after all hooks)
  if (loading) {
    return (
      <div className="min-h-screen bg-[#FFF8E8] flex items-center justify-center">
        <div className="text-center">
          <div className="inline-block animate-spin rounded-full h-12 w-12 border-b-2 border-[#EAB308]"></div>
          <p className="mt-4 text-gray-600">Loading...</p>
        </div>
      </div>
    );
  }

  const handleLogin = async (email: string, password: string) => {
    try {
      setError(null);
      setFieldErrors({});
      const credentials: LoginData = { email, password };
      const response = await login(credentials);
      
      // Navigate based on user type
      if (response.user.userType === 'admin') {
        setCurrentPage('admin-dashboard');
      } else {
        setCurrentPage('user-dashboard');
      }
    } catch (err: any) {
      console.error('Login failed:', err);
      
      // Extract error message
      let errorMessage = 'Login failed. Please check your credentials.';
      if (err.message) {
        errorMessage = err.message;
      } else if (err.errors) {
        setFieldErrors(err.errors);
        errorMessage = 'Please correct the errors below.';
      }
      
      setError(errorMessage);
    }
  };

  const handleSignup = async (fullName: string, email: string, password: string, confirmPassword: string) => {
    try {
      setError(null);
      setFieldErrors({});
      
      // Split full name into first and last name
      const nameParts = fullName.trim().split(/\s+/).filter(part => part.length > 0);
      
      if (nameParts.length === 0) {
        setError('Please enter your name');
        return;
      }
      
      const firstName = nameParts[0];
      const lastName = nameParts.length > 1 ? nameParts.slice(1).join(' ') : nameParts[0];
      
      const userData: RegisterData = {
        email,
        password,
        confirmPassword,
        firstName,
        lastName,
        userType: 'pet_owner'
      };
      
      console.log('Attempting registration with:', { ...userData, password: '***' });
      const response = await register(userData);
      
      // Show success toast and redirect
      toast.success('Registration successful! Redirecting to login...');
      setError(null);
      setFieldErrors({});
      
      setTimeout(() => {
        setCurrentPage('login');
      }, 2000);
    } catch (err: any) {
      console.error('Registration failed - Full error:', err);
      
      // Extract error message from various error formats
      let errorMessage = 'Registration failed. Please try again.';
      
      if (err.message) {
        errorMessage = err.message;
      }
      
      if (err.errors) {
        // Handle validation errors from backend
        setFieldErrors(err.errors);
        errorMessage = 'Please correct the errors below.';
      }
      
      setError(errorMessage);
    }
  };

  const handleLogout = async () => {
    try {
      await logout();
      setCurrentPage('landing');
    } catch (err: any) {
      console.error('Logout failed:', err);
      // Still navigate to landing page even if API call fails
      setCurrentPage('landing');
    }
  };

  // Show loading state
  if (loading && isLoggedIn) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#EAB308] mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen">
      <Toaster position="top-right" richColors />
      
      {currentPage === 'landing' && (
        <LandingPage
          onNavigateToLogin={() => setCurrentPage('login')}
          onNavigateToSignup={() => setCurrentPage('signup')}
        />
      )}
      {currentPage === 'login' && (
        <LoginPage
          onLogin={handleLogin}
          onNavigateToSignup={() => setCurrentPage('signup')}
          onNavigateToHome={() => setCurrentPage('landing')}
          onNavigateToForgotPassword={() => setCurrentPage('forgot-password')}
          error={error}
        />
      )}
      {currentPage === 'signup' && (
        <SignupPage
          onSignup={handleSignup}
          onNavigateToLogin={() => setCurrentPage('login')}
          error={error}
          fieldErrors={fieldErrors}
        />
      )}
      {currentPage === 'forgot-password' && (
        <ForgotPasswordPage
          onNavigateToLogin={() => setCurrentPage('login')}
          onNavigateToVerifyOTP={(email) => {
            setForgotPasswordEmail(email);
            setCurrentPage('verify-otp');
          }}
        />
      )}
      {currentPage === 'verify-otp' && (
        <VerifyOTPPage
          email={forgotPasswordEmail}
          onNavigateToLogin={() => setCurrentPage('login')}
          onNavigateToResetPassword={(token) => {
            setResetToken(token);
            setCurrentPage('reset-password');
          }}
        />
      )}
      {currentPage === 'reset-password' && (
        <ResetPasswordPage
          resetToken={resetToken}
          onNavigateToLogin={() => setCurrentPage('login')}
          onPasswordResetSuccess={() => {
            toast.success('Password reset successful! Redirecting to login...');
            setTimeout(() => setCurrentPage('login'), 2000);
          }}
        />
      )}
      {currentPage === 'user-dashboard' && user && (
        <>
          {/* RBAC Check: Only pet owners can access user dashboard */}
          {!isAdmin(user) ? (
            <UserDashboard
              user={{
                id: user.id,
                email: user.email,
                role: user.userType === 'admin' ? 'admin' : 'user',
                fullName: user.fullName
              }}
              onLogout={handleLogout}
            />
          ) : (
            <PermissionDenied 
              message="Admin users should use the Admin Dashboard."
              redirectTo="/"
              redirectLabel="Go to Admin Dashboard"
            />
          )}
        </>
      )}
      {currentPage === 'admin-dashboard' && user && (
        <>
          {/* RBAC Check: Only admins can access admin dashboard */}
          {isAdmin(user) ? (
            <AdminDashboard
              user={{
                id: user.id,
                email: user.email,
                role: 'admin',
                fullName: user.fullName
              }}
              onLogout={handleLogout}
            />
          ) : (
            <PermissionDenied 
              message="You need administrator privileges to access this page."
              redirectTo="/"
              redirectLabel="Go to Dashboard"
            />
          )}
        </>
      )}
      {currentPage === 'permission-denied' && (
        <PermissionDenied />
      )}
    </div>
  );
}

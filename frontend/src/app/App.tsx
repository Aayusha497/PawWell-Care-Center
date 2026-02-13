import { useEffect, useState } from 'react';
import { toast } from 'sonner';
import { useAuth } from '../context/AuthContext';
import { isAdmin } from '../utils/rbac';
import AdminDashboard from './components/AdminDashboard';
import ForgotPasswordPage from './components/ForgotPasswordPage';
import LandingPage from './components/LandingPage';
import LoginPage from './components/LoginPage';
import PermissionDenied from '../components/PermissionDenied';
import ResetPasswordPage from './components/ResetPasswordPage';
import SignupPage from './components/SignupPage';
import UserDashboard from './components/UserDashboard';
import VerifyOTPPage from './components/VerifyOTPPage';
import AboutPage from './components/AboutPage';
import { Toaster } from './components/ui/sonner';
import type { LoginData, RegisterData } from '../services/api';

type Page =
  | 'landing'
  | 'login'
  | 'signup'
  | 'forgot-password'
  | 'verify-otp'
  | 'reset-password'
  | 'user-dashboard'
  | 'admin-dashboard'
  | 'permission-denied'
  | 'about';

export default function App() {
  const { user, login, register, logout, loading, isLoggedIn } = useAuth();
  const [currentPage, setCurrentPage] = useState<Page>('landing');
  const [error, setError] = useState<string | null>(null);
  const [fieldErrors, setFieldErrors] = useState<Record<string, string[]>>({});
  const [forgotPasswordEmail, setForgotPasswordEmail] = useState('');
  const [resetToken, setResetToken] = useState('');
  const [aboutScrollTarget, setAboutScrollTarget] = useState<'contact' | null>(null);
  const [dashboardTarget, setDashboardTarget] = useState<'booking' | 'add-pet' | 'activity-log' | null>(null);

  useEffect(() => {
    if (isLoggedIn && user) {
      const shouldRedirect = ['landing', 'login', 'signup', 'forgot-password', 'verify-otp', 'reset-password'].includes(currentPage);

      if (shouldRedirect) {
        if (user.userType === 'admin') {
          setCurrentPage('admin-dashboard');
        } else {
          setCurrentPage('user-dashboard');
        }
      }
    }
  }, [isLoggedIn, user, currentPage]);

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

      if (response.user.userType === 'admin') {
        setCurrentPage('admin-dashboard');
      } else {
        setCurrentPage('user-dashboard');
      }
    } catch (err: any) {
      console.error('Login failed:', err);

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

      const response = await register(userData);

      if (response) {
        toast.success('Registration successful! Redirecting to login...');
      }

      setError(null);
      setFieldErrors({});

      setTimeout(() => {
        setCurrentPage('login');
      }, 2000);
    } catch (err: any) {
      console.error('Registration failed - Full error:', err);

      let errorMessage = 'Registration failed. Please try again.';

      if (err.message) {
        errorMessage = err.message;
      }

      if (err.errors) {
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
      setDashboardTarget(null);
    } catch (err: any) {
      console.error('Logout failed:', err);
      setCurrentPage('landing');
      setDashboardTarget(null);
    }
  };

  const handleNavigate = (page: Page, options?: { target?: 'contact' }) => {
    setCurrentPage(page);

    if (page === 'about') {
      setAboutScrollTarget(options?.target ?? null);
    } else {
      setAboutScrollTarget(null);
    }
  };

  const handleDashboardTarget = (target: 'booking' | 'add-pet' | 'activity-log') => {
    setDashboardTarget(target);
    setCurrentPage(isLoggedIn ? 'user-dashboard' : 'login');
  };


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
      {currentPage === 'about' && (
        <AboutPage
          onBack={() => handleNavigate(isLoggedIn ? 'user-dashboard' : 'landing')}
          onBook={() => handleDashboardTarget('booking')}
          onAddPet={() => handleDashboardTarget('add-pet')}
          onActivityLog={() => handleDashboardTarget('activity-log')}
          onLogout={isLoggedIn ? handleLogout : undefined}
          userFullName={user?.fullName}
          scrollTarget={aboutScrollTarget}
          onClearScrollTarget={() => setAboutScrollTarget(null)}
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
        !isAdmin(user) ? (
          <UserDashboard
            user={{
              id: user.id,
              email: user.email,
              role: user.userType === 'admin' ? 'admin' : 'user',
              fullName: user.fullName
            }}
            onLogout={handleLogout}
            onNavigate={(page, options) => handleNavigate(page as Page, options)}
            dashboardTarget={dashboardTarget}
            onClearDashboardTarget={() => setDashboardTarget(null)}
          />
        ) : (
          <PermissionDenied
            message="Admin users should use the Admin Dashboard."
            redirectTo="/"
            redirectLabel="Go to Admin Dashboard"
          />
        )
      )}
      {currentPage === 'admin-dashboard' && user && (
        isAdmin(user) ? (
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
        )
      )}
      {currentPage === 'permission-denied' && (
        <PermissionDenied />
      )}
    </div>
  );
}

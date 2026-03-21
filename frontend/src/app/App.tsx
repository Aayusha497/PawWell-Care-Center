import { useEffect, useState } from 'react';
import { toast } from 'sonner';
import Swal from 'sweetalert2';
import { useAuth } from '../context/AuthContext.tsx';
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
import ContactPage from './components/ContactPage';
import EmergencyPage from './components/EmergencyPage';
import PaymentSuccessPage from './components/PaymentSuccessPage';
import ProfilePage from './components/ProfilePage';
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
  | 'about'
  | 'contact'
  | 'emergency'
  | 'profile'
  | 'payment-success';

export default function App() {
  const { user, login, register, logout, loading, isLoggedIn } = useAuth();
  
  // Check if we're on payment-success page (with query params from Khalti OR stored in localStorage)
  const isPaymentSuccessPath = () => {
    const pathname = window.location.pathname;
    const hasPaymentParams = window.location.search.includes('pidx') || window.location.search.includes('idx');
    const hasStoredPidx = localStorage.getItem('khalti_pidx') !== null;
    
    console.log('🔍 [App.tsx] isPaymentSuccessPath check:', {
      pathname,
      hasPaymentParams,
      hasStoredPidx,
      khalti_pidx: localStorage.getItem('khalti_pidx'),
      khalti_booking_id: localStorage.getItem('khalti_booking_id')
    });
    
    // Payment success if: correct path, OR has URL params, OR we detect localStorage pidx
    return pathname === '/payment-success' || (hasPaymentParams && pathname === '/') || hasStoredPidx;
  };
  
  const [currentPage, setCurrentPage] = useState<Page>(() => {
    const isPaymentSuccess = isPaymentSuccessPath();
    console.log('🚀 [App.tsx] Initial page detection:', {
      isPaymentSuccess,
      pathname: window.location.pathname,
      search: window.location.search,
      localStorage_pidx: localStorage.getItem('khalti_pidx'),
      localStorage_booking_id: localStorage.getItem('khalti_booking_id')
    });
    
    if (isPaymentSuccess) {
      console.log('🎯 [App.tsx] DETECTED PAYMENT SUCCESS PATH - Setting currentPage to payment-success');
      return 'payment-success';
    }

    // Restore page from sessionStorage on mount to persist across refreshes
    const savedPage = sessionStorage.getItem('currentPage');
    const initialPage = (savedPage as Page) || 'landing';
    console.log('📄 [App.tsx] Restoring page from storage:', initialPage);
    return initialPage;
  });
  const [error, setError] = useState<string | null>(null);
  const [fieldErrors, setFieldErrors] = useState<Record<string, string[]>>({});
  const [forgotPasswordEmail, setForgotPasswordEmail] = useState('');
  const [resetToken, setResetToken] = useState('');
  const [dashboardTarget, setDashboardTarget] = useState<'booking' | 'add-pet' | 'activity-log' | 'wellness-timeline' | 'settings' | null>(null);
  const [showSignupSuccess, setShowSignupSuccess] = useState(false);

  // Detect URL changes and switch to payment-success page if needed
  useEffect(() => {
    const handleUrlChange = () => {
      if (isPaymentSuccessPath() && currentPage !== 'payment-success') {
        console.log('🎯 [App.tsx] URL changed to payment-success, switching page');
        setCurrentPage('payment-success');
      }
    };

    window.addEventListener('popstate', handleUrlChange);
    // Also check on mount in case URL was set before React initialized
    handleUrlChange();
    
    return () => window.removeEventListener('popstate', handleUrlChange);
  }, [currentPage]);

  // Persist current page to sessionStorage whenever it changes
  useEffect(() => {
    sessionStorage.setItem('currentPage', currentPage);
  }, [currentPage]);

  useEffect(() => {
    if (isLoggedIn && user) {
      const authPages = ['landing', 'login', 'signup', 'forgot-password', 'verify-otp', 'reset-password'];
      const shouldRedirect = authPages.includes(currentPage);

      // CRITICAL: Never redirect away from payment-success page!
      // Payment verification must complete before redirecting
      // ALSO: If URL has payment parameters, force payment-success page
      const hasPaymentParams = window.location.search.includes('pidx') || window.location.search.includes('idx');
      if (hasPaymentParams && currentPage !== 'payment-success') {
        console.log('🚨 [App.tsx] Payment parameters detected - forcing payment-success page');
        setCurrentPage('payment-success');
        return;
      }

      if (shouldRedirect && currentPage !== 'payment-success') {
        // Check if profile is complete before redirecting to dashboard (for both admin and users)
        if (!user.isProfileComplete) {
          setCurrentPage('profile');
        } else if (user.userType === 'admin') {
          setCurrentPage('admin-dashboard');
        } else {
          setCurrentPage('user-dashboard');
        }
      }
    } else if (!isLoggedIn && !loading) {
      // If not logged in and on a protected page, redirect to landing
      // BUT: Don't redirect if we're on the login page with an error (user is trying to fix their credentials)
      // AND: Don't redirect from payment-success (user needs to verify payment even if session expired)
      const protectedPages = ['user-dashboard', 'admin-dashboard', 'profile'];
      const hasPaymentParams = window.location.search.includes('pidx') || window.location.search.includes('idx');
      if (protectedPages.includes(currentPage) && currentPage !== 'payment-success' && !hasPaymentParams) {
        setCurrentPage('landing');
      }
    }
  }, [isLoggedIn, user, loading, currentPage]);

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

      // Show beautiful SweetAlert2 popup
      await Swal.fire({
        title: 'Logged In Successfully!',
        text: 'Welcome back! Please setup your profile to get started.',
        icon: 'success',
        confirmButtonText: 'Continue',
        confirmButtonColor: '#EAB308',
        allowOutsideClick: false,
        allowEscapeKey: false,
        timer: 4000,
        timerProgressBar: true,
      });

      // Check if profile is complete for both admin and regular users
      if (!response.user.isProfileComplete) {
        // Redirect to profile setup page first
        setCurrentPage('profile');
      } else if (response.user.userType === 'admin') {
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

      // Set error and show it
      setError(errorMessage);
      toast.error('Login Failed', {
        description: errorMessage,
        duration: 4000,
      });
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
        toast.success('Account created successfully!');
        setShowSignupSuccess(true);
      }

      setError(null);
      setFieldErrors({});
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

  const handleSignupSuccessClose = () => {
    setShowSignupSuccess(false);
    setCurrentPage('login');
  };

  const handleClearLoginError = () => {
    setError(null);
    setFieldErrors({});
  };

  const handleNavigate = (page: Page) => {
    setCurrentPage(page);
  };

  const handleDashboardTarget = (target: 'booking' | 'add-pet' | 'activity-log' | 'wellness-timeline' | 'settings') => {
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
          onClearError={handleClearLoginError}
        />
      )}
      {currentPage === 'signup' && (
        <SignupPage
          onSignup={handleSignup}
          onNavigateToLogin={() => setCurrentPage('login')}
          onNavigateToHome={() => setCurrentPage('landing')}
          error={error}
          fieldErrors={fieldErrors}
          showSignupSuccess={showSignupSuccess}
          onSignupSuccessClose={handleSignupSuccessClose}
        />
      )}
      {currentPage === 'about' && (
        <AboutPage
          onBack={() => handleNavigate(isLoggedIn ? 'user-dashboard' : 'landing')}
          onBook={() => handleDashboardTarget('booking')}
          onAddPet={() => handleDashboardTarget('add-pet')}
          onActivityLog={() => handleDashboardTarget('activity-log')}
          onTimeline={() => handleDashboardTarget('wellness-timeline')}
          onContact={() => handleNavigate('contact')}
          onEmergency={() => handleNavigate('emergency')}
          onSettings={() => handleDashboardTarget('settings')}
          onNavigate={handleNavigate}
          onLogout={isLoggedIn ? handleLogout : undefined}
          user={user}
          userFullName={user?.fullName}
        />
      )}
      {currentPage === 'contact' && (
        <ContactPage
          onBack={() => handleNavigate(isLoggedIn ? 'user-dashboard' : 'landing')}
          onBook={() => handleDashboardTarget('booking')}
          onActivityLog={() => handleDashboardTarget('activity-log')}
          onTimeline={() => handleDashboardTarget('wellness-timeline')}
          onAbout={() => handleNavigate('about')}
          onEmergency={() => handleNavigate('emergency')}
          onSettings={() => handleDashboardTarget('settings')}
          onNavigate={handleNavigate}
          onLogout={isLoggedIn ? handleLogout : undefined}
          user={user}
          userFullName={user?.fullName}
        />
      )}
      {currentPage === 'emergency' && (
        <EmergencyPage
          onBack={() => handleNavigate(isLoggedIn ? 'user-dashboard' : 'landing')}
          onBook={() => handleDashboardTarget('booking')}
          onActivityLog={() => handleDashboardTarget('activity-log')}
          onTimeline={() => handleDashboardTarget('wellness-timeline')}
          onAbout={() => handleNavigate('about')}
          onContact={() => handleNavigate('contact')}
          onEmergency={() => handleNavigate('emergency')}
          onSettings={() => handleDashboardTarget('settings')}
          onLogout={isLoggedIn ? handleLogout : undefined}
          user={user}
        />
      )}
      {currentPage === 'profile' && user && (
        <ProfilePage
          onBack={() => handleNavigate(isAdmin(user) ? 'admin-dashboard' : 'user-dashboard')}
          onLogout={handleLogout}
          userFullName={user.fullName}
          onNavigate={(page) => handleNavigate(page as Page)}
          onDashboardTarget={handleDashboardTarget}
        />
      )}
      {currentPage === 'payment-success' && (
        <PaymentSuccessPage
          onContinue={() => {
            if (isLoggedIn) {
              setCurrentPage('user-dashboard');
              window.history.replaceState({}, document.title, '/');
            } else {
              setCurrentPage('login');
              window.history.replaceState({}, document.title, '/login');
            }
          }}
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
              fullName: user.fullName,
              profilePicture: user.profilePicture
            }}
            onLogout={handleLogout}
            onNavigate={(page) => handleNavigate(page as Page)}
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
              fullName: user.fullName,
              profilePicture: user.profilePicture
            }}
            onLogout={handleLogout}
            onNavigate={(page) => handleNavigate(page as Page)}
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

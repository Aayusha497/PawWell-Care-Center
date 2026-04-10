import { useState, useEffect, useRef } from 'react';
import { useAuth } from '../../context/AuthContext';
import { useTheme } from '../../context/ThemeContext';
import { toast } from 'sonner';
import { Settings, User as UserIcon, Moon, Sun, X, Shield, Copy, Check, LogOut } from 'lucide-react';
import { getSettings, updateSettings, changePassword, changeEmail, resetSettings, get2FAStatus, setup2FA, verify2FA, disable2FA } from '../../services/api';
import { isAdmin } from '../../utils/rbac';
import NotificationBell from '../../components/NotificationBell';

interface SettingsPageProps {
  onBack: () => void;
  onLogout: () => void;
  userFullName: string;
  onNavigate?: (page: 'user-dashboard' | 'admin-dashboard' | 'profile' | 'about' | 'contact' | 'emergency') => void;
  onDashboardTarget?: (target: 'booking' | 'add-pet' | 'activity-log' | 'wellness-timeline') => void;
  hideNavbar?: boolean;
}

export default function SettingsPage({ onBack, onLogout, userFullName, onNavigate, onDashboardTarget, hideNavbar = false }: SettingsPageProps) {
  const { user, refreshUserProfile } = useAuth();
  const { theme, setTheme } = useTheme();
  const [emailNotifications, setEmailNotifications] = useState(true);
  const [smsNotifications, setSmsNotifications] = useState(false);
  const [ activityUpdates, setActivityUpdates] = useState(true);
  const [bookingReminders, setBookingReminders] = useState(true);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [showProfileDropdown, setShowProfileDropdown] = useState(false);
  const profileDropdownRef = useRef<HTMLDivElement>(null);

  // Password modal state
  const [showPasswordModal, setShowPasswordModal] = useState(false);
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [changingPassword, setChangingPassword] = useState(false);

  // Email modal state
  const [showEmailModal, setShowEmailModal] = useState(false);
  const [newEmail, setNewEmail] = useState('');
  const [changingEmail, setChangingEmail] = useState(false);

  // Privacy modals
  const [show2FAModal, setShow2FAModal] = useState(false);
  const [showDataPrivacyModal, setShowDataPrivacyModal] = useState(false);

  // 2FA state
  const [twoFactorEnabled, setTwoFactorEnabled] = useState(false);
  const [twoFactorStep, setTwoFactorStep] = useState<'status' | 'setup' | 'verify' | 'disable'>('status');
  const [qrCode, setQrCode] = useState('');
  const [manualEntryCode, setManualEntryCode] = useState('');
  const [backupCodes, setBackupCodes] = useState<string[]>([]);
  const [verificationToken, setVerificationToken] = useState('');
  const [disablePassword, setDisablePassword] = useState('');
  const [disableToken, setDisableToken] = useState('');
  const [processing2FA, setProcessing2FA] = useState(false);
  const [copiedCodes, setCopiedCodes] = useState(false);

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (profileDropdownRef.current && !profileDropdownRef.current.contains(event.target as Node)) {
        setShowProfileDropdown(false);
      }
    };

    if (showProfileDropdown) {
      document.addEventListener('mousedown', handleClickOutside);
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [showProfileDropdown]);

  // Fetch settings on component mount
  useEffect(() => {
    const fetchSettings = async () => {
      try {
        setLoading(true);
        const response = await getSettings();
        if (response.success && response.data) {
          setTheme(response.data.theme || 'light');
          setEmailNotifications(response.data.emailNotifications ?? true);
          setSmsNotifications(response.data.smsNotifications ?? false);
          setActivityUpdates(response.data.activityUpdates ?? true);
          setBookingReminders(response.data.bookingReminders ?? true);
        }
      } catch (error: any) {
        console.error('Error fetching settings:', error);
        // Don't show error toast, just use defaults
      } finally {
        setLoading(false);
      }
    };

    fetchSettings();
  }, []); // Empty dependency array - only run on mount

  // Fetch 2FA status when modal opens
  useEffect(() => {
    const fetch2FAStatus = async () => {
      if (show2FAModal) {
        try {
          const response = await get2FAStatus();
          if (response.success) {
            setTwoFactorEnabled(response.data.enabled || false);
            setTwoFactorStep('status');
          }
        } catch (error: any) {
          console.error('Error fetching 2FA status:', error);
          toast.error('Failed to load 2FA status');
        }
      }
    };

    fetch2FAStatus();
  }, [show2FAModal]);

  const saveSettings = async () => {
    try {
      setSaving(true);
      const response = await updateSettings({
        theme,
        emailNotifications,
        smsNotifications,
        activityUpdates,
        bookingReminders
      });

      if (response.success) {
        toast.success('Settings saved successfully!');
      }
    } catch (error: any) {
      console.error('Error saving settings:', error);
      toast.error(error.message || 'Failed to save settings');
    } finally {
      setSaving(false);
    }
  };

  const handleThemeToggle = async () => {
    const newTheme = theme === 'light' ? 'dark' : 'light';
    setTheme(newTheme);
    
    // Save theme immediately to backend
    try {
      await updateSettings({
        theme: newTheme,
        emailNotifications,
        smsNotifications,
        activityUpdates,
        bookingReminders
      });
    } catch (error: any) {
      console.error('Error saving theme:', error);
      // Revert theme on error
      setTheme(theme);
      toast.error('Failed to save theme preference');
    }
  };

  const handlePasswordChange = async () => {
    if (!currentPassword || !newPassword || !confirmPassword) {
      toast.error('Please fill in all password fields');
      return;
    }

    if (newPassword !== confirmPassword) {
      toast.error('New passwords do not match');
      return;
    }

    if (newPassword.length < 8) {
      toast.error('Password must be at least 8 characters long');
      return;
    }

    try {
      setChangingPassword(true);
      const response = await changePassword({
        currentPassword,
        newPassword
      });

      if (response.success) {
        toast.success('Password changed successfully!');
        setShowPasswordModal(false);
        setCurrentPassword('');
        setNewPassword('');
        setConfirmPassword('');
      }
    } catch (error: any) {
      console.error('Error changing password:', error);
      toast.error(error.message || 'Failed to change password');
    } finally {
      setChangingPassword(false);
    }
  };

  const handleEmailChange = async () => {
    if (!newEmail) {
      toast.error('Please enter a new email address');
      return;
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(newEmail)) {
      toast.error('Please enter a valid email address');
      return;
    }

    try {
      setChangingEmail(true);
      const response = await changeEmail({
        newEmail,
        password: '' // Password no longer required
      });

      if (response.success) {
        toast.success('Email changed successfully!');
        setShowEmailModal(false);
        setNewEmail('');
        // Refresh user profile to get updated email
        await refreshUserProfile();
      }
    } catch (error: any) {
      console.error('Error changing email:', error);
      toast.error(error.message || 'Failed to change email');
    } finally {
      setChangingEmail(false);
    }
  };

  const handleResetSettings = async () => {
    if (!confirm('Are you sure you want to reset all settings to default values?')) {
      return;
    }

    try {
      const response = await resetSettings();
      if (response.success && response.data) {
        setTheme(response.data.theme || 'light');
        setEmailNotifications(response.data.emailNotifications ?? true);
        setSmsNotifications(response.data.smsNotifications ?? false);
        setActivityUpdates(response.data.activityUpdates ?? true);
        setBookingReminders(response.data.bookingReminders ?? true);
        toast.success('Settings reset to defaults successfully!');
      }
    } catch (error: any) {
      console.error('Error resetting settings:', error);
      toast.error(error.message || 'Failed to reset settings');
    }
  };

  // 2FA Handlers
  const handleSetup2FA = async () => {
    try {
      setProcessing2FA(true);
      const response = await setup2FA();
      
      if (response.success) {
        setQrCode(response.data.qrCode);
        setManualEntryCode(response.data.manualEntry);
        setBackupCodes(response.data.backupCodes);
        setTwoFactorStep('setup');
        toast.success('2FA setup initiated. Please scan the QR code.');
      }
    } catch (error: any) {
      console.error('Error setting up 2FA:', error);
      toast.error(error.message || 'Failed to setup 2FA');
    } finally {
      setProcessing2FA(false);
    }
  };

  const handleVerify2FA = async () => {
    if (!verificationToken || verificationToken.length !== 6) {
      toast.error('Please enter a valid 6-digit code');
      return;
    }

    try {
      setProcessing2FA(true);
      const response = await verify2FA({ token: verificationToken });
      
      if (response.success) {
        setTwoFactorEnabled(true);
        setTwoFactorStep('verify');
        toast.success('2FA enabled successfully!');
      }
    } catch (error: any) {
      console.error('Error verifying 2FA:', error);
      toast.error(error.message || 'Invalid verification code');
    } finally {
      setProcessing2FA(false);
    }
  };

  const handleDisable2FA = async () => {
    if (!disablePassword) {
      toast.error('Please enter your password');
      return;
    }

    if (!disableToken) {
      toast.error('Please enter your authenticator code or a backup code');
      return;
    }

    try {
      setProcessing2FA(true);
      const response = await disable2FA({
        password: disablePassword,
        token: disableToken
      });
      
      if (response.success) {
        setTwoFactorEnabled(false);
        setTwoFactorStep('status');
        setDisablePassword('');
        setDisableToken('');
        toast.success('2FA disabled successfully');
        setShow2FAModal(false);
      }
    } catch (error: any) {
      console.error('Error disabling 2FA:', error);
      toast.error(error.message || 'Failed to disable 2FA');
    } finally {
      setProcessing2FA(false);
    }
  };

  const handleCopyBackupCodes = () => {
    const codesText = backupCodes.join('\n');
    navigator.clipboard.writeText(codesText);
    setCopiedCodes(true);
    toast.success('Backup codes copied to clipboard!');
    setTimeout(() => setCopiedCodes(false), 2000);
  };

  const handleClose2FAModal = () => {
    setShow2FAModal(false);
    setTwoFactorStep('status');
    setQrCode('');
    setManualEntryCode('');
    setBackupCodes([]);
    setVerificationToken('');
    setDisablePassword('');
    setDisableToken('');
    setCopiedCodes(false);
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-[#FFF9F5] dark:bg-gray-900 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#FA9884] mx-auto"></div>
          <p className="mt-4 text-gray-600 dark:text-gray-400">Loading settings...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#FFF9F5] dark:bg-gray-900 transition-colors">
      {!hideNavbar && user && (
        isAdmin(user) ? (
          <nav className="bg-white dark:bg-gray-800 border-b dark:border-gray-700 px-8 py-4">
            <div className="max-w-7xl mx-auto flex items-center justify-between">
              <button 
                onClick={() => onNavigate?.('admin-dashboard')}
                className="flex items-center gap-2 cursor-pointer hover:opacity-80 transition"
                title="Go to Admin Dashboard"
              >
                <span className="text-2xl">🐾</span>
                <span className="font-semibold text-gray-800 dark:text-gray-100">PawWell Admin</span>
              </button>
              <div className="flex items-center gap-3">
                {/* Profile Dropdown */}
                <div className="relative" ref={profileDropdownRef}>
                  <button
                    onClick={() => setShowProfileDropdown(!showProfileDropdown)}
                    className="w-10 h-10 rounded-full hover:shadow-lg transition-all cursor-pointer border-2 border-gray-300 dark:border-gray-600 overflow-hidden"
                    title="Profile Menu"
                  >
                    {user.profilePicture ? (
                      <img
                        src={user.profilePicture}
                        alt="Profile"
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      <div className="w-full h-full bg-[#FA9884] flex items-center justify-center text-white font-semibold">
                        {user.firstName?.[0]?.toUpperCase() || 'A'}
                      </div>
                    )}
                  </button>

                  {/* Dropdown Menu */}
                  {showProfileDropdown && (
                    <div className="absolute right-0 mt-2 w-56 bg-white dark:bg-gray-800 rounded-xl shadow-lg border border-gray-200 dark:border-gray-700 py-2 z-50">
                      <div className="px-4 py-3 border-b border-gray-100 dark:border-gray-700">
                        <p className="text-sm font-semibold text-gray-800 dark:text-gray-200">{user.firstName} {user.lastName}</p>
                        <p className="text-xs text-gray-500 dark:text-gray-400 truncate">{user.email}</p>
                      </div>
                      <button
                        onClick={() => {
                          setShowProfileDropdown(false);
                          onNavigate?.('profile');
                        }}
                        className="w-full text-left px-4 py-2.5 hover:bg-gray-50 dark:hover:bg-gray-700 flex items-center gap-3 text-gray-700 dark:text-gray-300 transition-colors"
                      >
                        <UserIcon size={18} className="text-gray-500 dark:text-gray-400" />
                        <span className="text-sm font-medium">Edit Profile</span>
                      </button>
                      <div className="border-t border-gray-100 dark:border-gray-700 my-1"></div>
                      <button
                        onClick={() => {
                          setShowProfileDropdown(false);
                          onLogout();
                        }}
                        className="w-full text-left px-4 py-2.5 hover:bg-red-50 dark:hover:bg-red-900/50 flex items-center gap-3 text-red-600 dark:text-red-400 transition-colors"
                      >
                        <LogOut size={18} className="text-red-500 dark:text-red-400" />
                        <span className="text-sm font-medium">Logout</span>
                      </button>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </nav>
        ) : (
          <nav className="bg-white dark:bg-gray-800 border-b dark:border-gray-700 px-8 py-3">
            <div className="max-w-7xl mx-auto flex items-center justify-between">
              <div className="flex items-center gap-8">
                <button 
                  onClick={onBack}
                  className="flex items-center gap-2 cursor-pointer hover:opacity-80 transition"
                  title="Go to Dashboard"
                >
                  <span className="text-2xl">🐾</span>
                </button>
                <div className="flex items-center gap-6">
                  <button 
                    onClick={onBack}
                    className="px-4 py-2 rounded-full bg-[#FFE4A3] dark:bg-yellow-600 dark:text-white font-medium"
                  >
                    Home
                  </button>
                  <button 
                    onClick={() => onDashboardTarget?.('booking')}
                    className="px-4 py-2 hover:bg-gray-100 dark:hover:bg-gray-700 dark:text-gray-200 rounded-full"
                  >
                    Booking
                  </button>
                  <button
                    onClick={() => onDashboardTarget?.('activity-log')}
                    className="px-4 py-2 hover:bg-gray-100 dark:hover:bg-gray-700 dark:text-gray-200 rounded-full"
                  >
                    Activity Log
                  </button>
                  <button
                    onClick={() => onDashboardTarget?.('wellness-timeline')}
                    className="px-4 py-2 hover:bg-gray-100 dark:hover:bg-gray-700 dark:text-gray-200 rounded-full"
                  >
                    Timeline
                  </button>
                  <button
                    onClick={() => onNavigate?.('about')}
                    className="px-4 py-2 hover:bg-gray-100 dark:hover:bg-gray-700 dark:text-gray-200 rounded-full"
                  >
                    About
                  </button>
                  <button
                    onClick={() => onNavigate?.('contact')}
                    className="px-4 py-2 hover:bg-gray-100 dark:hover:bg-gray-700 dark:text-gray-200 rounded-full"
                  >
                    Contact
                  </button>
                </div>
              </div>
              <div className="flex items-center gap-4">
                <NotificationBell userId={parseInt(user.id)} />
                <button
                  onClick={() => onNavigate?.('emergency')}
                  className="px-4 py-2 bg-[#FF6B6B] dark:bg-red-700 text-white rounded-full text-sm flex items-center gap-2"
                >
                  <span>📞</span> Emergency
                </button>
                {/* Profile Dropdown */}
                <div className="relative" ref={profileDropdownRef}>
                  <button
                    onClick={() => setShowProfileDropdown(!showProfileDropdown)}
                    className="w-10 h-10 rounded-full hover:shadow-lg transition-all cursor-pointer border-2 border-gray-200 dark:border-gray-600 overflow-hidden"
                    title="Profile Menu"
                  >
                    {user.profilePicture ? (
                      <img 
                        src={user.profilePicture} 
                        alt="Profile" 
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      <div className="w-full h-full bg-gradient-to-br from-[#FA9884] to-[#FFE4A3] flex items-center justify-center">
                        <span className="text-sm font-bold text-white">
                          {user.firstName?.charAt(0)?.toUpperCase() || 'U'}{user.lastName?.charAt(0)?.toUpperCase() || ''}
                        </span>
                      </div>
                    )}
                  </button>

                  {/* Dropdown Menu */}
                  {showProfileDropdown && (
                    <div className="absolute right-0 mt-2 w-56 bg-white dark:bg-gray-800 rounded-xl shadow-lg border border-gray-200 dark:border-gray-700 py-2 z-50">
                      <div className="px-4 py-3 border-b border-gray-100 dark:border-gray-700">
                        <p className="text-sm font-semibold text-gray-800 dark:text-gray-200">{user.firstName} {user.lastName}</p>
                        <p className="text-xs text-gray-500 dark:text-gray-400 truncate">{user.email}</p>
                      </div>
                      <button
                        onClick={() => {
                          setShowProfileDropdown(false);
                          onNavigate?.('profile');
                        }}
                        className="w-full text-left px-4 py-2.5 hover:bg-gray-50 dark:hover:bg-gray-700 flex items-center gap-3 text-gray-700 dark:text-gray-300 transition-colors"
                      >
                        <UserIcon size={18} className="text-gray-500 dark:text-gray-400" />
                        <span className="text-sm font-medium">Edit Profile</span>
                      </button>
                      <div className="border-t border-gray-100 dark:border-gray-700 my-1"></div>
                      <button
                        onClick={() => {
                          setShowProfileDropdown(false);
                          onLogout();
                        }}
                        className="w-full text-left px-4 py-2.5 hover:bg-red-50 dark:hover:bg-red-900/50 flex items-center gap-3 text-red-600 dark:text-red-400 transition-colors"
                      >
                        <LogOut size={18} className="text-red-500 dark:text-red-400" />
                        <span className="text-sm font-medium">Logout</span>
                      </button>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </nav>
        )
      )}
      <main className="max-w-4xl mx-auto px-8 py-8">
        <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-md p-8 transition-colors">
          <div className="flex justify-between items-center mb-8 pb-4 border-b dark:border-gray-700">
            <div>
              <h2 className="text-3xl font-bold text-gray-800 dark:text-gray-100">Settings</h2>
              <p className="text-gray-600 dark:text-gray-400 mt-1">Manage your account preferences</p>
            </div>
            {/* <button
              onClick={onBack}
              className="px-4 py-2 text-gray-600 hover:bg-gray-100 rounded-lg transition-colors"
            >
              ← Back
            </button> */}
          </div>

          {/* Appearance Settings */}
          <section className="mb-8">
            <h3 className="text-xl font-semibold text-gray-800 dark:text-gray-100 mb-4 flex items-center gap-2">
              {theme === 'dark' ? <Moon size={20} /> : <Sun size={20} />}
              Appearance
            </h3>
            <div className="space-y-4">
              <div className="flex items-center justify-between p-4 bg-gray-50 dark:bg-gray-700 rounded-lg transition-colors">
                <div>
                  <p className="font-medium text-gray-700 dark:text-gray-200 flex items-center gap-2">
                    {theme === 'dark' ? <Moon size={18} /> : <Sun size={18} />}
                    Dark Mode
                  </p>
                  <p className="text-sm text-gray-500 dark:text-gray-400">
                    {theme === 'dark' ? 'Switch to light mode' : 'Switch to dark mode'}
                  </p>
                </div>
                <label className="relative inline-flex items-center cursor-pointer">
                  <input
                    type="checkbox"
                    checked={theme === 'dark'}
                    onChange={handleThemeToggle}
                    className="sr-only peer"
                  />
                  <div className="w-11 h-6 bg-gray-200 dark:bg-gray-600 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-[#FA9884]/20 rounded-full peer peer-checked:after:translate-x-full rtl:peer-checked:after:-translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:start-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-[#FA9884]"></div>
                </label>
              </div>
            </div>
          </section>

          {/* Account Settings */}
          <section className="mb-8">
            <h3 className="text-xl font-semibold text-gray-800 dark:text-gray-100 mb-4">Account Information</h3>
            <div className="space-y-4">
              <div className="flex items-center justify-between p-4 bg-gray-50 dark:bg-gray-700 rounded-lg transition-colors">
                <div>
                  <p className="font-medium text-gray-700 dark:text-gray-200">Email</p>
                  <p className="text-sm text-gray-500 dark:text-gray-400">{user?.email}</p>
                </div>
                <button 
                  onClick={() => setShowEmailModal(true)}
                  className="text-[#FA9884] hover:underline text-sm font-medium"
                >
                  Change
                </button>
              </div>
              <div className="flex items-center justify-between p-4 bg-gray-50 dark:bg-gray-700 rounded-lg transition-colors">
                <div>
                  <p className="font-medium text-gray-700 dark:text-gray-200">Password</p>
                  <p className="text-sm text-gray-500 dark:text-gray-400">••••••••</p>
                </div>
                <button 
                  onClick={() => setShowPasswordModal(true)}
                  className="text-[#FA9884] hover:underline text-sm font-medium"
                >
                  Change
                </button>
              </div>
            </div>
          </section>

          {/* Notification Settings */}
          <section className="mb-8">
            <h3 className="text-xl font-semibold text-gray-800 dark:text-gray-100 mb-4">Notifications</h3>
            <div className="space-y-4">
              <div className="flex items-center justify-between p-4 bg-gray-50 dark:bg-gray-700 rounded-lg transition-colors">
                <div>
                  <p className="font-medium text-gray-700 dark:text-gray-200">Email Notifications</p>
                  <p className="text-sm text-gray-500 dark:text-gray-400">Receive updates via email</p>
                </div>
                <label className="relative inline-flex items-center cursor-pointer">
                  <input
                    type="checkbox"
                    checked={emailNotifications}
                    onChange={(e) => setEmailNotifications(e.target.checked)}
                    className="sr-only peer"
                  />
                  <div className="w-11 h-6 bg-gray-200 dark:bg-gray-600 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-[#FA9884]/20 rounded-full peer peer-checked:after:translate-x-full rtl:peer-checked:after:-translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:start-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-[#FA9884]"></div>
                </label>
              </div>
              <div className="flex items-center justify-between p-4 bg-gray-50 dark:bg-gray-700 rounded-lg transition-colors">
                <div>
                  <p className="font-medium text-gray-700 dark:text-gray-200">SMS Notifications</p>
                  <p className="text-sm text-gray-500 dark:text-gray-400">Receive text message alerts</p>
                </div>
                <label className="relative inline-flex items-center cursor-pointer">
                  <input
                    type="checkbox"
                    checked={smsNotifications}
                    onChange={(e) => setSmsNotifications(e.target.checked)}
                    className="sr-only peer"
                  />
                  <div className="w-11 h-6 bg-gray-200 dark:bg-gray-600 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-[#FA9884]/20 rounded-full peer peer-checked:after:translate-x-full rtl:peer-checked:after:-translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:start-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-[#FA9884]"></div>
                </label>
              </div>
              <div className="flex items-center justify-between p-4 bg-gray-50 dark:bg-gray-700 rounded-lg transition-colors">
                <div>
                  <p className="font-medium text-gray-700 dark:text-gray-200">Activity Updates</p>
                  <p className="text-sm text-gray-500 dark:text-gray-400">Get notified about pet activities</p>
                </div>
                <label className="relative inline-flex items-center cursor-pointer">
                  <input
                    type="checkbox"
                    checked={activityUpdates}
                    onChange={(e) => setActivityUpdates(e.target.checked)}
                    className="sr-only peer"
                  />
                  <div className="w-11 h-6 bg-gray-200 dark:bg-gray-600 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-[#FA9884]/20 rounded-full peer peer-checked:after:translate-x-full rtl:peer-checked:after:-translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:start-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-[#FA9884]"></div>
                </label>
              </div>
              <div className="flex items-center justify-between p-4 bg-gray-50 dark:bg-gray-700 rounded-lg transition-colors">
                <div>
                  <p className="font-medium text-gray-700 dark:text-gray-200">Booking Reminders</p>
                  <p className="text-sm text-gray-500 dark:text-gray-400">Reminders for upcoming bookings</p>
                </div>
                <label className="relative inline-flex items-center cursor-pointer">
                  <input
                    type="checkbox"
                    checked={bookingReminders}
                    onChange={(e) => setBookingReminders(e.target.checked)}
                    className="sr-only peer"
                  />
                  <div className="w-11 h-6 bg-gray-200 dark:bg-gray-600 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-[#FA9884]/20 rounded-full peer peer-checked:after:translate-x-full rtl:peer-checked:after:-translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:start-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-[#FA9884]"></div>
                </label>
              </div>
            </div>
          </section>

          {/* Privacy Settings */}
          <section className="mb-8">
            <h3 className="text-xl font-semibold text-gray-800 dark:text-gray-100 mb-4">Privacy & Security</h3>
            <div className="space-y-4">
              <div className="flex items-center justify-between p-4 bg-gray-50 dark:bg-gray-700 rounded-lg transition-colors">
                <div>
                  <p className="font-medium text-gray-700 dark:text-gray-200">Two-Factor Authentication</p>
                  <p className="text-sm text-gray-500 dark:text-gray-400">Add an extra layer of security</p>
                </div>
                <button 
                  onClick={() => setShow2FAModal(true)}
                  className="text-[#FA9884] hover:underline text-sm font-medium"
                >
                  Enable
                </button>
              </div>
              <div className="flex items-center justify-between p-4 bg-gray-50 dark:bg-gray-700 rounded-lg transition-colors">
                <div>
                  <p className="font-medium text-gray-700 dark:text-gray-200">Data Privacy</p>
                  <p className="text-sm text-gray-500 dark:text-gray-400">Manage your data preferences</p>
                </div>
                <button 
                  onClick={() => setShowDataPrivacyModal(true)}
                  className="text-[#FA9884] hover:underline text-sm font-medium"
                >
                  View
                </button>
              </div>
            </div>
          </section>

          {/* Save Button */}
          <div className="flex justify-between gap-4 pt-6 border-t dark:border-gray-700">
            <button
              onClick={handleResetSettings}
              className="px-6 py-3 border-2 border-red-300 dark:border-red-600 text-red-600 dark:text-red-400 rounded-lg font-semibold hover:bg-red-50 dark:hover:bg-red-900/20 transition"
            >
              Reset to Defaults
            </button>
            <div className="flex gap-4">
              <button
                onClick={onBack}
                className="px-6 py-3 border-2 border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-200 rounded-lg font-semibold hover:bg-gray-50 dark:hover:bg-gray-700 transition"
              >
                Cancel
              </button>
              <button
                onClick={saveSettings}
                disabled={saving}
                className="px-6 py-3 bg-[#FA9884] text-white rounded-lg font-semibold hover:bg-[#E8876F] transition disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {saving ? 'Saving...' : 'Save Changes'}
              </button>
            </div>
          </div>
        </div>
      </main>

      {/* Change Password Modal */}
      {showPasswordModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white dark:bg-gray-800 rounded-2xl p-6 max-w-md w-full shadow-xl transition-colors">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-2xl font-bold text-gray-800 dark:text-gray-100">Change Password</h3>
              <button
                onClick={() => {
                  setShowPasswordModal(false);
                  setCurrentPassword('');
                  setNewPassword('');
                  setConfirmPassword('');
                }}
                className="text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200"
              >
                <X size={24} />
              </button>
            </div>
            
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Current Password
                </label>
                <input
                  type="password"
                  value={currentPassword}
                  onChange={(e) => setCurrentPassword(e.target.value)}
                  className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-[#FA9884] focus:border-transparent dark:bg-gray-700 dark:text-gray-100"
                  placeholder="Enter current password"
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  New Password
                </label>
                <input
                  type="password"
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-[#FA9884] focus:border-transparent dark:bg-gray-700 dark:text-gray-100"
                  placeholder="Enter new password (min 8 characters)"
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Confirm New Password
                </label>
                <input
                  type="password"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-[#FA9884] focus:border-transparent dark:bg-gray-700 dark:text-gray-100"
                  placeholder="Confirm new password"
                />
              </div>
            </div>
            
            <div className="flex gap-4 mt-6">
              <button
                onClick={() => {
                  setShowPasswordModal(false);
                  setCurrentPassword('');
                  setNewPassword('');
                  setConfirmPassword('');
                }}
                className="flex-1 px-6 py-3 border-2 border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-200 rounded-lg font-semibold hover:bg-gray-50 dark:hover:bg-gray-700 transition"
              >
                Cancel
              </button>
              <button
                onClick={handlePasswordChange}
                disabled={changingPassword}
                className="flex-1 px-6 py-3 bg-[#FA9884] text-white rounded-lg font-semibold hover:bg-[#E8876F] transition disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {changingPassword ? 'Changing...' : 'Change Password'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Change Email Modal */}
      {showEmailModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white dark:bg-gray-800 rounded-2xl p-6 max-w-md w-full shadow-xl transition-colors">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-2xl font-bold text-gray-800 dark:text-gray-100">Change Email</h3>
              <button
                onClick={() => {
                  setShowEmailModal(false);
                  setNewEmail('');
                }}
                className="text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200"
              >
                <X size={24} />
              </button>
            </div>
            
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Current Email
                </label>
                <input
                  type="email"
                  value={user?.email || ''}
                  disabled
                  className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-gray-100 dark:bg-gray-600 text-gray-600 dark:text-gray-300"
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  New Email
                </label>
                <input
                  type="email"
                  value={newEmail}
                  onChange={(e) => setNewEmail(e.target.value)}
                  className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-[#FA9884] focus:border-transparent dark:bg-gray-700 dark:text-gray-100"
                  placeholder="Enter new email address"
                />
              </div>
            </div>
            
            <div className="flex gap-4 mt-6">
              <button
                onClick={() => {
                  setShowEmailModal(false);
                  setNewEmail('');
                }}
                className="flex-1 px-6 py-3 border-2 border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-200 rounded-lg font-semibold hover:bg-gray-50 dark:hover:bg-gray-700 transition"
              >
                Cancel
              </button>
              <button
                onClick={handleEmailChange}
                disabled={changingEmail}
                className="flex-1 px-6 py-3 bg-[#FA9884] text-white rounded-lg font-semibold hover:bg-[#E8876F] transition disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {changingEmail ? 'Changing...' : 'Change Email'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Two-Factor Authentication Modal */}
      {show2FAModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white dark:bg-gray-800 rounded-2xl p-6 max-w-md w-full shadow-xl transition-colors max-h-[90vh] overflow-y-auto">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-2xl font-bold text-gray-800 dark:text-gray-100 flex items-center gap-2">
                <Shield className="w-6 h-6 text-[#FA9884]" />
                Two-Factor Authentication
              </h3>
              <button
                onClick={handleClose2FAModal}
                className="text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200"
              >
                <X size={24} />
              </button>
            </div>
            
            {/* Status View */}
            {twoFactorStep === 'status' && (
              <div className="space-y-4">
                <div className={`${twoFactorEnabled ? 'bg-green-50 dark:bg-green-900/20 border-green-200 dark:border-green-800' : 'bg-blue-50 dark:bg-blue-900/20 border-blue-200 dark:border-blue-800'} border rounded-lg p-4`}>
                  <p className={`text-sm ${twoFactorEnabled ? 'text-green-800 dark:text-green-200' : 'text-blue-800 dark:text-blue-200'}`}>
                    {twoFactorEnabled 
                      ? 'Two-factor authentication is currently enabled on your account.' 
                      : 'Add an extra layer of security by enabling two-factor authentication.'}
                  </p>
                </div>
                
                {!twoFactorEnabled && (
                  <div className="space-y-3">
                    <h4 className="font-semibold text-gray-800 dark:text-gray-100">How it works:</h4>
                    <ul className="list-disc list-inside space-y-2 text-sm text-gray-600 dark:text-gray-400">
                      <li>Download an authenticator app (Google Authenticator, Authy, etc.)</li>
                      <li>Scan the QR code we'll provide</li>
                      <li>Enter the 6-digit code from your app to verify</li>
                      <li>Save backup codes in a safe place</li>
                    </ul>
                  </div>
                )}
                
                <div className="flex gap-4 mt-6">
                  <button
                    onClick={handleClose2FAModal}
                    className="flex-1 px-6 py-3 border-2 border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-200 rounded-lg font-semibold hover:bg-gray-50 dark:hover:bg-gray-700 transition"
                  >
                    Close
                  </button>
                  {twoFactorEnabled ? (
                    <button
                      onClick={() => setTwoFactorStep('disable')}
                      className="flex-1 px-6 py-3 bg-red-600 text-white rounded-lg font-semibold hover:bg-red-700 transition"
                    >
                      Disable 2FA
                    </button>
                  ) : (
                    <button
                      onClick={handleSetup2FA}
                      disabled={processing2FA}
                      className="flex-1 px-6 py-3 bg-[#FA9884] text-white rounded-lg font-semibold hover:bg-[#E8876F] transition disabled:opacity-50"
                    >
                      {processing2FA ? 'Setting up...' : 'Enable 2FA'}
                    </button>
                  )}
                </div>
              </div>
            )}

            {/* Setup View - QR Code */}
            {twoFactorStep === 'setup' && (
              <div className="space-y-4">
                <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg p-4">
                  <p className="text-sm text-blue-800 dark:text-blue-200">
                    <strong>Step 1:</strong> Scan this QR code with your authenticator app
                  </p>
                </div>

                {/* QR Code */}
                <div className="flex justify-center bg-white p-4 rounded-lg">
                  <img src={qrCode} alt="2FA QR Code" className="w-64 h-64" />
                </div>

                {/* Manual Entry */}
                <div className="bg-gray-50 dark:bg-gray-700 rounded-lg p-4">
                  <p className="text-xs text-gray-600 dark:text-gray-400 mb-2">
                    Can't scan? Enter this code manually:
                  </p>
                  <code className="text-sm font-mono bg-white dark:bg-gray-800 px-3 py-2 rounded block break-all">
                    {manualEntryCode}
                  </code>
                </div>

                {/* Backup Codes */}
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <h4 className="font-semibold text-gray-800 dark:text-gray-100">Backup Codes</h4>
                    <button
                      onClick={handleCopyBackupCodes}
                      className="flex items-center gap-1 text-sm text-[#FA9884] hover:text-[#E8876F]"
                    >
                      {copiedCodes ? <Check size={16} /> : <Copy size={16} />}
                      {copiedCodes ? 'Copied!' : 'Copy All'}
                    </button>
                  </div>
                  <div className="bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800 rounded-lg p-3">
                    <p className="text-xs text-yellow-800 dark:text-yellow-200 mb-2">
                      Save these codes in a safe place. Each can be used once if you lose access to your authenticator.
                    </p>
                    <div className="grid grid-cols-2 gap-2 text-sm font-mono">
                      {backupCodes.map((code, index) => (
                        <div key={index} className="bg-white dark:bg-gray-800 px-2 py-1 rounded text-center">
                          {code}
                        </div>
                      ))}
                    </div>
                  </div>
                </div>

                {/* Verification Input */}
                <div className="space-y-2">
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                    <strong>Step 2:</strong> Enter the 6-digit code from your app
                  </label>
                  <input
                    type="text"
                    maxLength={6}
                    value={verificationToken}
                    onChange={(e) => setVerificationToken(e.target.value.replace(/\D/g, ''))}
                    placeholder="000000"
                    className="w-full px-4 py-3 border-2 border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-[#FA9884] focus:border-transparent dark:bg-gray-700 dark:text-white text-center text-2xl font-mono tracking-widest"
                  />
                </div>

                <div className="flex gap-4">
                  <button
                    onClick={() => {
                      setTwoFactorStep('status');
                      setQrCode('');
                      setBackupCodes([]);
                      setVerificationToken('');
                    }}
                    className="flex-1 px-6 py-3 border-2 border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-200 rounded-lg font-semibold hover:bg-gray-50 dark:hover:bg-gray-700 transition"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={handleVerify2FA}
                    disabled={processing2FA || verificationToken.length !== 6}
                    className="flex-1 px-6 py-3 bg-[#FA9884] text-white rounded-lg font-semibold hover:bg-[#E8876F] transition disabled:opacity-50"
                  >
                    {processing2FA ? 'Verifying...' : 'Verify & Enable'}
                  </button>
                </div>
              </div>
            )}

            {/* Verify Success View */}
            {twoFactorStep === 'verify' && (
              <div className="space-y-4">
                <div className="bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-lg p-4 text-center">
                  <Check className="w-16 h-16 text-green-600 mx-auto mb-3" />
                  <p className="text-lg font-semibold text-green-800 dark:text-green-200">
                    Two-Factor Authentication Enabled!
                  </p>
                  <p className="text-sm text-green-700 dark:text-green-300 mt-2">
                    Your account is now more secure. You'll need your authenticator app to log in.
                  </p>
                </div>

                <div className="bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800 rounded-lg p-4">
                  <p className="text-sm text-yellow-800 dark:text-yellow-200">
                    <strong>Important:</strong> Make sure you've saved your backup codes. You won't be able to see them again.
                  </p>
                </div>

                <button
                  onClick={handleClose2FAModal}
                  className="w-full px-6 py-3 bg-[#FA9884] text-white rounded-lg font-semibold hover:bg-[#E8876F] transition"
                >
                  Done
                </button>
              </div>
            )}

            {/* Disable View */}
            {twoFactorStep === 'disable' && (
              <div className="space-y-4">
                <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg p-4">
                  <p className="text-sm text-red-800 dark:text-red-200">
                    <strong>Warning:</strong> Disabling 2FA will make your account less secure.
                  </p>
                </div>

                <div className="space-y-3">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                      Password
                    </label>
                    <input
                      type="password"
                      value={disablePassword}
                      onChange={(e) => setDisablePassword(e.target.value)}
                      placeholder="Enter your password"
                      className="w-full px-4 py-3 border-2 border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-[#FA9884] focus:border-transparent dark:bg-gray-700 dark:text-white"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                      Authenticator Code or Backup Code
                    </label>
                    <input
                      type="text"
                      value={disableToken}
                      onChange={(e) => setDisableToken(e.target.value)}
                      placeholder="Enter 6-digit code or backup code"
                      className="w-full px-4 py-3 border-2 border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-[#FA9884] focus:border-transparent dark:bg-gray-700 dark:text-white"
                    />
                  </div>
                </div>

                <div className="flex gap-4">
                  <button
                    onClick={() => {
                      setTwoFactorStep('status');
                      setDisablePassword('');
                      setDisableToken('');
                    }}
                    className="flex-1 px-6 py-3 border-2 border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-200 rounded-lg font-semibold hover:bg-gray-50 dark:hover:bg-gray-700 transition"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={handleDisable2FA}
                    disabled={processing2FA || !disablePassword || !disableToken}
                    className="flex-1 px-6 py-3 bg-red-600 text-white rounded-lg font-semibold hover:bg-red-700 transition disabled:opacity-50"
                  >
                    {processing2FA ? 'Disabling...' : 'Disable 2FA'}
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Data Privacy Modal */}
      {showDataPrivacyModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white dark:bg-gray-800 rounded-2xl p-6 max-w-2xl w-full max-h-[80vh] overflow-y-auto shadow-xl transition-colors">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-2xl font-bold text-gray-800 dark:text-gray-100">Data Privacy</h3>
              <button
                onClick={() => setShowDataPrivacyModal(false)}
                className="text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200"
              >
                <X size={24} />
              </button>
            </div>
            
            <div className="space-y-6">
              <section>
                <h4 className="text-lg font-semibold text-gray-800 dark:text-gray-100 mb-2">What Data We Collect</h4>
                <ul className="list-disc list-inside space-y-2 text-gray-600 dark:text-gray-400">
                  <li>Account information (name, email, phone number)</li>
                  <li>Pet profiles and health records</li>
                  <li>Booking and appointment history</li>
                  <li>Communication preferences</li>
                  <li>Emergency contact information</li>
                </ul>
              </section>

              <section>
                <h4 className="text-lg font-semibold text-gray-800 dark:text-gray-100 mb-2">How We Use Your Data</h4>
                <ul className="list-disc list-inside space-y-2 text-gray-600 dark:text-gray-400">
                  <li>Providing and improving our pet care services</li>
                  <li>Sending appointment reminders and updates</li>
                  <li>Maintaining your pet's health records</li>
                  <li>Processing bookings and payments</li>
                  <li>Communicating important service information</li>
                </ul>
              </section>

              <section>
                <h4 className="text-lg font-semibold text-gray-800 dark:text-gray-100 mb-2">Your Rights</h4>
                <ul className="list-disc list-inside space-y-2 text-gray-600 dark:text-gray-400">
                  <li><strong>Access:</strong> Request a copy of your personal data</li>
                  <li><strong>Correction:</strong> Update or correct inaccurate data</li>
                  <li><strong>Deletion:</strong> Request deletion of your account and data</li>
                  <li><strong>Export:</strong> Download your data in a portable format</li>
                  <li><strong>Opt-out:</strong> Unsubscribe from marketing communications</li>
                </ul>
              </section>

              <section>
                <h4 className="text-lg font-semibold text-gray-800 dark:text-gray-100 mb-2">Data Security</h4>
                <p className="text-gray-600 dark:text-gray-400">
                  We use industry-standard encryption and security measures to protect your data. 
                  Your information is stored securely and accessed only by authorized personnel 
                  for legitimate business purposes.
                </p>
              </section>

              <section>
                <h4 className="text-lg font-semibold text-gray-800 dark:text-gray-100 mb-2">Data Retention</h4>
                <p className="text-gray-600 dark:text-gray-400">
                  We retain your data for as long as your account is active or as needed to provide 
                  services. You can request deletion of your account at any time through your settings.
                </p>
              </section>

              <div className="bg-gray-50 dark:bg-gray-700 rounded-lg p-4 mt-4">
                <p className="text-sm text-gray-600 dark:text-gray-400">
                  For more information, please read our full{' '}
                  <a href="#" className="text-[#FA9884] hover:underline font-medium">Privacy Policy</a>
                  {' '}and{' '}
                  <a href="#" className="text-[#FA9884] hover:underline font-medium">Terms of Service</a>.
                </p>
              </div>
            </div>
            
            <div className="flex gap-4 mt-6">
              <button
                onClick={() => setShowDataPrivacyModal(false)}
                className="flex-1 px-6 py-3 bg-[#FA9884] text-white rounded-lg font-semibold hover:bg-[#E8876F] transition"
              >
                Close
              </button>
              <button
                onClick={() => {
                  toast.info('Data export feature coming soon!');
                }}
                className="flex-1 px-6 py-3 border-2 border-[#FA9884] text-[#FA9884] rounded-lg font-semibold hover:bg-[#FA9884]/10 transition"
              >
                Export My Data
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

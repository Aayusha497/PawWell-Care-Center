import { useState, useEffect, useRef } from 'react';
import { useAuth } from '../../context/AuthContext';
import { updateProfile, deleteAccount } from '../../services/api';
import { toast } from 'sonner';
import { Settings, User as UserIcon, LogOut } from 'lucide-react';
import SettingsPage from './SettingsPage';
import { isAdmin } from '../../utils/rbac';
import NotificationBell from '../../components/NotificationBell';
import DeleteAccountModal from './ui/DeleteAccountModal';
import CancelConfirmationModal from './ui/CancelConfirmationModal';

interface ProfilePageProps {
  onBack: () => void;
  onLogout: () => void;
  userFullName: string;
  onNavigate?: (page: 'booking' | 'activity-log' | 'about' | 'contact' | 'emergency' | 'user-dashboard' | 'admin-dashboard' | 'profile') => void;
  onDashboardTarget?: (target: 'booking' | 'add-pet' | 'activity-log' | 'wellness-timeline') => void;
}

export default function ProfilePage({ onBack, onLogout, userFullName, onNavigate, onDashboardTarget }: ProfilePageProps) {
  const { user, refreshUserProfile } = useAuth();
  const [editing, setEditing] = useState(false);
  const [loading, setLoading] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [avatarPreview, setAvatarPreview] = useState<string | null>(null);
  const [profilePictureFile, setProfilePictureFile] = useState<File | null>(null);
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});
  const [showProfileDropdown, setShowProfileDropdown] = useState(false);
  const [showSettings, setShowSettings] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [showCancelModal, setShowCancelModal] = useState(false);
  const profileDropdownRef = useRef<HTMLDivElement>(null);
  
  const [formData, setFormData] = useState({
    firstName: '',
    lastName: '',
    phoneNumber: '',
    address: '',
    city: '',
    emergencyContactName: '',
    emergencyContactNumber: '',
  });

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

  useEffect(() => {
    if (user) {
      setFormData({
        firstName: user.firstName || '',
        lastName: user.lastName || '',
        phoneNumber: user.phoneNumber || '',
        address: user.address || '',
        city: user.city || '',
        emergencyContactName: user.emergencyContactName || '',
        emergencyContactNumber: user.emergencyContactNumber || ''
      });
      
      if (user.profilePicture) {
        setAvatarPreview(user.profilePicture);
      }
      
      // Only force editing mode if profile is incomplete
      // This ensures view mode is shown when profile is complete
      setEditing(!user.isProfileComplete);
    }
  }, [user]);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
    
    // Clear error for this field when user starts typing
    if (fieldErrors[name]) {
      setFieldErrors(prev => {
        const updated = { ...prev };
        delete updated[name];
        return updated;
      });
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      if (file.size > 5 * 1024 * 1024) {
        toast.error('File size should be less than 5MB');
        return;
      }
      
      if (!file.type.startsWith('image/')) {
        toast.error('Please upload an image file');
        return;
      }
      
      setProfilePictureFile(file);
      const reader = new FileReader();
      reader.onloadend = () => {
        setAvatarPreview(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    console.log('🔵 Profile form submitted');
    console.log('Form data:', formData);
    
    // Validation - check all required fields
    const errors: Record<string, string> = {};
    const isInitialSetup = !user?.isProfileComplete;
    
    // Always required fields
    if (!formData.firstName || formData.firstName.trim() === '') {
      errors.firstName = 'First Name is required';
    } else {
      const firstNameValue = formData.firstName.trim();
      if (!/^[A-Za-z\s]+$/.test(firstNameValue)) {
        errors.firstName = 'First Name can only contain letters (A–Z), no numbers or symbols allowed';
      }
    }
    if (!formData.lastName || formData.lastName.trim() === '') {
      errors.lastName = 'Last Name is required';
    } else {
      const lastNameValue = formData.lastName.trim();
      if (!/^[A-Za-z\s]+$/.test(lastNameValue)) {
        errors.lastName = 'Last Name can only contain letters (A–Z), no numbers or symbols allowed';
      }
    }
    
    // Phone Number validation - must be exactly 10 digits
    if (!formData.phoneNumber || formData.phoneNumber.trim() === '') {
      errors.phoneNumber = 'Phone Number is required';
    } else {
      const phoneValue = formData.phoneNumber.trim();
      if (!/^\d{10}$/.test(phoneValue)) {
        errors.phoneNumber = 'Phone Number must be exactly 10 digits with no letters or symbols';
      }
    }
    
    // City validation - only letters, no numbers or symbols
    if (isInitialSetup) {
      if (!formData.address || formData.address.trim() === '') {
        errors.address = 'Address is required';
      }
      
      if (!formData.city || formData.city.trim() === '') {
        errors.city = 'City is required';
      } else {
        const cityValue = formData.city.trim();
        if (!/^[A-Za-z\s]+$/.test(cityValue)) {
          errors.city = 'City can only contain letters (A–Z), no numbers or symbols allowed';
        }
      }
      
      // Emergency Contact Name validation - only letters
      if (!formData.emergencyContactName || formData.emergencyContactName.trim() === '') {
        errors.emergencyContactName = 'Emergency Contact Name is required';
      } else {
        const nameValue = formData.emergencyContactName.trim();
        if (!/^[A-Za-z\s]+$/.test(nameValue)) {
          errors.emergencyContactName = 'Emergency Contact Name can only contain letters (A–Z), no numbers or symbols allowed';
        }
      }
      
      // Emergency Contact Number validation - must be exactly 10 digits
      if (!formData.emergencyContactNumber || formData.emergencyContactNumber.trim() === '') {
        errors.emergencyContactNumber = 'Emergency Contact Number is required';
      } else {
        const numberValue = formData.emergencyContactNumber.trim();
        if (!/^\d{10}$/.test(numberValue)) {
          errors.emergencyContactNumber = 'Emergency Contact Number must be exactly 10 digits with no letters or symbols';
        }
      }
    }
    
    if (Object.keys(errors).length > 0) {
      console.error('❌ Validation failed:', errors);
      setFieldErrors(errors);
      toast.error('Please check your information and try again');
      return;
    }
    
    // Clear any existing errors
    setFieldErrors({});
    
    setLoading(true);
    
    try {
      console.log('📤 Preparing form data for submission...');
      const submitData = new FormData();
      submitData.append('firstName', formData.firstName.trim());
      submitData.append('lastName', formData.lastName.trim());
      submitData.append('phoneNumber', formData.phoneNumber.trim());
      submitData.append('address', formData.address.trim());
      submitData.append('city', formData.city.trim());
      submitData.append('emergencyContactName', formData.emergencyContactName.trim());
      submitData.append('emergencyContactNumber', formData.emergencyContactNumber.trim());
      
      if (profilePictureFile) {
        console.log('📷 Adding profile picture to form data:', profilePictureFile.name);
        submitData.append('profilePicture', profilePictureFile, profilePictureFile.name);
      }

      // Log FormData contents for debugging
      console.log('📋 FormData contents:');
      for (let pair of submitData.entries()) {
        console.log(pair[0] + ': ' + (pair[1] instanceof File ? pair[1].name : pair[1]));
      }

      console.log('🚀 Calling updateProfile API...');
      const response = await updateProfile(submitData);
      console.log('✅ Update profile response:', response);
      
      toast.success(isInitialSetup ? 'Profile setup completed! Welcome to PawWell Care Center!' : 'Profile updated successfully!');
      
      console.log('🔄 Refreshing user profile...');
      await refreshUserProfile();
      
      // If this was initial setup, redirect to dashboard
      if (isInitialSetup) {
        setTimeout(() => {
          onBack(); // Navigate to dashboard
        }, 1500);
      } else {
        // Exit editing mode to show view mode with Edit/Delete buttons
        setEditing(false);
      }
      
    } catch (error: any) {
      console.error('❌ Profile update error:', error);
      console.error('Error details:', {
        message: error.message,
        response: error.response,
        data: error.response?.data
      });
      
      // Extract user-friendly error message
      let errorMessage = 'Unable to update your profile. Please try again.';
      
      if (error.message) {
        errorMessage = error.message;
      } else if (error.response?.data?.message) {
        errorMessage = error.response.data.message;
      } else if (error.response?.status === 401) {
        errorMessage = 'Your session has expired. Please log in again.';
      } else if (error.response?.status === 404) {
        errorMessage = 'Your account could not be found. Please log in again.';
      } else if (error.response?.status === 500) {
        errorMessage = 'A server error occurred. Please try again later.';
      }
      
      toast.error(errorMessage);
    } finally {
      setLoading(false);
      console.log('✅ Profile update process completed');
    }
  };

  const handleCancel = () => {
    console.log('🔵 Cancel button clicked');
    setShowCancelModal(true);
  };

  const handleConfirmCancel = async () => {
    // If profile is incomplete (initial setup), log out the user
    if (!user?.isProfileComplete) {
      console.log('🚪 Logging out user from profile setup');
      setShowCancelModal(false);
      await onLogout();
      return;
    }
    
    // If profile is complete, cancel editing and redirect to user dashboard
    if (user) {
      setFormData({
        firstName: user.firstName || '',
        lastName: user.lastName || '',
        phoneNumber: user.phoneNumber || '',
        address: user.address || '',
        city: user.city || '',
        emergencyContactName: user.emergencyContactName || '',
        emergencyContactNumber: user.emergencyContactNumber || ''
      });
      setAvatarPreview(user.profilePicture || null);
      setProfilePictureFile(null);
    }
    
    // Clear any field errors
    setFieldErrors({});
    setEditing(false);
    setShowCancelModal(false);
    console.log('✅ Editing cancelled, staying on profile page');
    
    // Stay on profile page in view mode
    // Just reset the editing state above which will trigger re-render to show view mode
  };

  const handleDeleteAccount = async () => {
    setDeleting(true);
    
    try {
      console.log('Deleting account...');
      await deleteAccount();
      console.log('Account deleted successfully');
      toast.success('Your account has been deleted successfully. Redirecting...');
      setShowDeleteModal(false);
      setTimeout(() => {
        onLogout(); // This will sign out the user and redirect to landing page
      }, 2000);
    } catch (error: any) {
      console.error('❌ Account deletion error:', error);
      toast.error('Failed to delete account: ' + (error.response?.data?.message || error.message || 'Unknown error'));
    } finally {
      setDeleting(false);
    }
  };

  if (!user) {
    return (
      <div className="min-h-screen bg-[#FFF9F5] dark:bg-gray-900 flex items-center justify-center">
        <div className="text-center dark:text-gray-100">Loading...</div>
      </div>
    );
  }

  // If showing settings page, render it instead
  if (showSettings) {
    const dashboardPage = isAdmin(user) ? 'admin-dashboard' : 'user-dashboard';
    return (
      <SettingsPage
        onBack={() => setShowSettings(false)}
        onLogout={onLogout}
        userFullName={userFullName}
        onNavigate={(page) => {
          if (page === 'user-dashboard' || page === 'admin-dashboard') {
            onNavigate?.(dashboardPage as any);
          } else if (page === 'profile') {
            setShowSettings(false);
          }
        }}
      />
    );
  }

  return (
    <div className="min-h-screen bg-[#FFF9F5] dark:bg-gray-900">
      {/* Navigation Header - Show for admins or if profile is complete */}
      {(user.isProfileComplete || isAdmin(user)) && (
        <nav className="bg-white dark:bg-gray-800 border-b dark:border-gray-700 px-8 py-3">
          <div className="max-w-7xl mx-auto flex items-center justify-between">
            <div className="flex items-center gap-8">
              <button 
                onClick={() => onNavigate?.(isAdmin(user) ? 'admin-dashboard' : 'user-dashboard')}
                className="flex items-center gap-2 cursor-pointer hover:opacity-80 transition"
                title="Go to Dashboard"
              >
                <span className="text-2xl">🐾</span>
                {isAdmin(user) && <span className="font-semibold text-gray-800 dark:text-gray-100">PawWell Admin</span>}
              </button>
              {!isAdmin(user) && (
                <div className="flex items-center gap-6">
                  <button 
                    onClick={() => onNavigate?.('user-dashboard')}
                    className="px-4 py-2 hover:bg-gray-100 dark:hover:bg-gray-700 dark:text-gray-200 rounded-full"
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
              )}
            </div>
            <div className="flex items-center gap-4">
              {!isAdmin(user) && (
                <>
                  <NotificationBell userId={parseInt(user.id)} />
                  <button
                    onClick={() => onNavigate?.('emergency')}
                    className="px-4 py-2 bg-[#FF6B6B] dark:bg-red-700 text-white rounded-full text-sm flex items-center gap-2"
                  >
                    <span>📞</span> Emergency
                  </button>
                </>
              )}
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
                        // Already on profile page, just close dropdown
                      }}
                      className="w-full text-left px-4 py-2.5 hover:bg-gray-50 dark:hover:bg-gray-700 flex items-center gap-3 text-gray-700 dark:text-gray-300 transition-colors"
                    >
                      <UserIcon size={18} className="text-gray-500 dark:text-gray-400" />
                      <span className="text-sm font-medium">Edit Profile</span>
                    </button>
                    <button
                      onClick={() => {
                        setShowProfileDropdown(false);
                        setShowSettings(true);
                      }}
                      className="w-full text-left px-4 py-2.5 hover:bg-gray-50 dark:hover:bg-gray-700 flex items-center gap-3 text-gray-700 dark:text-gray-300 transition-colors"
                    >
                      <Settings size={18} className="text-gray-500 dark:text-gray-400" />
                      <span className="text-sm font-medium">Settings</span>
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
      )}

      {/* Main Content */}
      <main className="max-w-4xl mx-auto px-8 py-8">
        <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-md p-8">
          <div className="flex justify-between items-center mb-6 pb-4 border-b dark:border-gray-700">
            <h2 className="text-2xl font-bold text-gray-800 dark:text-gray-100">
              {editing ? 'Edit Profile' : 'My Profile'}
            </h2>
            {user.isProfileComplete && !editing && (
              <button
                onClick={() => {
                  setEditing(true);
                  setFieldErrors({});
                }}
                className="px-6 py-2 bg-[#FA9884] text-white rounded-lg font-semibold hover:bg-[#E8876F] transition"
              >
                Edit Profile
              </button>
            )}
          </div>

          {editing ? (
            <form onSubmit={handleSubmit} className="space-y-6" autoComplete="off">
              {/* Avatar Upload */}
              <div className="flex items-center gap-6">
                <div className="w-24 h-24 rounded-full border-4 border-[#FA9884] overflow-hidden flex-shrink-0">
                  {avatarPreview ? (
                    <img src={avatarPreview} alt="Profile" className="w-full h-full object-cover" />
                  ) : (
                    <div className="w-full h-full bg-gradient-to-br from-[#FA9884] to-[#FFE4A3] flex items-center justify-center text-white text-3xl font-bold">
                      {formData.firstName?.charAt(0)?.toUpperCase() || 'U'}
                    </div>
                  )}
                </div>
                <div>
                  <input
                    type="file"
                    id="profilePicture"
                    accept="image/*"
                    onChange={handleFileChange}
                    className="hidden"
                  />
                  <label
                    htmlFor="profilePicture"
                    className="px-4 py-2 bg-[#FA9884] text-white rounded-lg cursor-pointer hover:bg-[#E8876F] transition inline-block"
                  >
                    Choose Photo
                  </label>
                  <p className="text-sm text-gray-500 dark:text-gray-400 mt-2">Max size: 5MB</p>
                </div>
              </div>

              {/* Name Fields */}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">First Name *</label>
                  <input
                    type="text"
                    name="firstName"
                    value={formData.firstName}
                    onChange={handleInputChange}
                    className={`w-full px-4 py-3 border-2 rounded-lg focus:outline-none transition dark:bg-gray-700 dark:text-gray-100 ${
                      fieldErrors.firstName ? 'border-red-500 focus:border-red-500' : 'border-gray-200 dark:border-gray-600 focus:border-[#FA9884]'
                    }`}
                  />
                  {fieldErrors.firstName && (
                    <p className="text-red-600 text-sm mt-1">{fieldErrors.firstName}</p>
                  )}
                </div>
                <div>
                  <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">Last Name *</label>
                  <input
                    type="text"
                    name="lastName"
                    value={formData.lastName}
                    onChange={handleInputChange}
                    className={`w-full px-4 py-3 border-2 rounded-lg focus:outline-none transition dark:bg-gray-700 dark:text-gray-100 ${
                      fieldErrors.lastName ? 'border-red-500 focus:border-red-500' : 'border-gray-200 dark:border-gray-600 focus:border-[#FA9884]'
                    }`}
                  />
                  {fieldErrors.lastName && (
                    <p className="text-red-600 text-sm mt-1">{fieldErrors.lastName}</p>
                  )}
                </div>
              </div>

              {/* Contact Info */}
              <div>
                <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">Phone Number *</label>
                <input
                  type="tel"
                  name="phoneNumber"
                  value={formData.phoneNumber}
                  onChange={handleInputChange}
                  className={`w-full px-4 py-3 border-2 rounded-lg focus:outline-none transition dark:bg-gray-700 dark:text-gray-100 ${
                    fieldErrors.phoneNumber ? 'border-red-500 focus:border-red-500' : 'border-gray-200 dark:border-gray-600 focus:border-[#FA9884]'
                  }`}
                />
                {fieldErrors.phoneNumber && (
                  <p className="text-red-600 text-sm mt-1">{fieldErrors.phoneNumber}</p>
                )}
              </div>

              <div>
                <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">Email</label>
                <input
                  type="email"
                  value={user.email}
                  disabled
                  className="w-full px-4 py-3 border-2 border-gray-200 dark:border-gray-600 rounded-lg bg-gray-50 dark:bg-gray-700 text-gray-600 dark:text-gray-400 cursor-not-allowed"
                />
              </div>

              <div>
                <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">Address {!user.isProfileComplete && '*'}</label>
                <input
                  type="text"
                  name="address"
                  value={formData.address}
                  onChange={handleInputChange}
                  autoComplete="off"
                  className={`w-full px-4 py-3 border-2 rounded-lg focus:outline-none transition dark:bg-gray-700 dark:text-gray-100 ${
                    fieldErrors.address ? 'border-red-500 focus:border-red-500' : 'border-gray-200 dark:border-gray-600 focus:border-[#FA9884]'
                  }`}
                />
                {fieldErrors.address && (
                  <p className="text-red-600 text-sm mt-1">{fieldErrors.address}</p>
                )}
              </div>

              <div>
                <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">City {!user.isProfileComplete && '*'}</label>
                <input
                  type="text"
                  name="city"
                  value={formData.city}
                  onChange={handleInputChange}
                  className={`w-full px-4 py-3 border-2 rounded-lg focus:outline-none transition dark:bg-gray-700 dark:text-gray-100 ${
                    fieldErrors.city ? 'border-red-500 focus:border-red-500' : 'border-gray-200 dark:border-gray-600 focus:border-[#FA9884]'
                  }`}
                />
                {fieldErrors.city && (
                  <p className="text-red-600 text-sm mt-1">{fieldErrors.city}</p>
                )}
              </div>

              {/* Emergency Contact */}
              <div className="pt-6 border-t dark:border-gray-700">
                <h3 className="text-lg font-semibold text-gray-700 dark:text-gray-300 mb-4">Emergency Contact {!user.isProfileComplete && '(Required)'}</h3>
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">Emergency Contact Name {!user.isProfileComplete && '*'}</label>
                    <input
                      type="text"
                      name="emergencyContactName"
                      value={formData.emergencyContactName}
                      onChange={handleInputChange}
                      className={`w-full px-4 py-3 border-2 rounded-lg focus:outline-none transition dark:bg-gray-700 dark:text-gray-100 ${
                        fieldErrors.emergencyContactName ? 'border-red-500 focus:border-red-500' : 'border-gray-200 dark:border-gray-600 focus:border-[#FA9884]'
                      }`}
                    />
                    {fieldErrors.emergencyContactName && (
                      <p className="text-red-600 text-sm mt-1">{fieldErrors.emergencyContactName}</p>
                    )}
                  </div>
                  <div>
                    <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">Emergency Contact Number {!user.isProfileComplete && '*'}</label>
                    <input
                      type="tel"
                      name="emergencyContactNumber"
                      value={formData.emergencyContactNumber}
                      onChange={handleInputChange}
                      className={`w-full px-4 py-3 border-2 rounded-lg focus:outline-none transition dark:bg-gray-700 dark:text-gray-100 ${
                        fieldErrors.emergencyContactNumber ? 'border-red-500 focus:border-red-500' : 'border-gray-200 dark:border-gray-600 focus:border-[#FA9884]'
                      }`}
                    />
                    {fieldErrors.emergencyContactNumber && (
                      <p className="text-red-600 text-sm mt-1">{fieldErrors.emergencyContactNumber}</p>
                    )}
                  </div>
                </div>
              </div>

              {/* Form Actions */}
              <div className="flex gap-4 pt-6 border-t dark:border-gray-700">
                <button
                  type="submit"
                  disabled={loading}
                  className="flex-1 px-6 py-3 bg-[#FA9884] text-white rounded-lg font-semibold hover:bg-[#E8876F] disabled:opacity-50 disabled:cursor-not-allowed transition"
                >
                  {loading ? 'Saving...' : 'Save Profile'}
                </button>
                <button
                  type="button"
                  onClick={handleCancel}
                  disabled={loading}
                  className="px-6 py-3 border-2 border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 rounded-lg font-semibold hover:bg-gray-50 dark:hover:bg-gray-700 disabled:opacity-50 disabled:cursor-not-allowed transition"
                >
                  Cancel
                </button>
              </div>
            </form>
          ) : (
            <div className="space-y-6">
              {/* Avatar Display */}
              <div className="flex justify-center mb-8">
                {user.profilePicture ? (
                  <img
                    src={user.profilePicture}
                    alt="Profile"
                    className="w-32 h-32 rounded-full object-cover border-4 border-[#FA9884]"
                  />
                ) : (
                  <div className="w-32 h-32 rounded-full bg-gradient-to-br from-[#FA9884] to-[#FFE4A3] flex items-center justify-center text-white text-5xl font-bold border-4 border-[#FA9884]">
                    {user.firstName?.charAt(0)?.toUpperCase() || 'U'}
                  </div>
                )}
              </div>

              {/* Profile Info Display */}
              <div className="space-y-4">
                <div className="flex py-3 border-b dark:border-gray-700">
                  <span className="font-semibold text-gray-700 dark:text-gray-300 w-48">Name:</span>
                  <span className="text-gray-900 dark:text-gray-100">{user.firstName} {user.lastName}</span>
                </div>
                <div className="flex py-3 border-b dark:border-gray-700">
                  <span className="font-semibold text-gray-700 dark:text-gray-300 w-48">Email:</span>
                  <span className="text-gray-900 dark:text-gray-100">{user.email}</span>
                </div>
                <div className="flex py-3 border-b dark:border-gray-700">
                  <span className="font-semibold text-gray-700 dark:text-gray-300 w-48">Phone:</span>
                  <span className="text-gray-900 dark:text-gray-100">{user.phoneNumber || 'Not provided'}</span>
                </div>
                <div className="flex py-3 border-b dark:border-gray-700">
                  <span className="font-semibold text-gray-700 dark:text-gray-300 w-48">Address:</span>
                  <span className="text-gray-900 dark:text-gray-100">{user.address || 'Not provided'}</span>
                </div>
                <div className="flex py-3 border-b dark:border-gray-700">
                  <span className="font-semibold text-gray-700 dark:text-gray-300 w-48">City:</span>
                  <span className="text-gray-900 dark:text-gray-100">{user.city || 'Not provided'}</span>
                </div>

                {(user.emergencyContactName || user.emergencyContactNumber) && (
                  <>
                    <h3 className="text-lg font-semibold text-gray-700 dark:text-gray-300 mt-6 mb-2">Emergency Contact</h3>
                    <div className="flex py-3 border-b dark:border-gray-700">
                      <span className="font-semibold text-gray-700 dark:text-gray-300 w-48">Name:</span>
                      <span className="text-gray-900 dark:text-gray-100">{user.emergencyContactName || 'Not provided'}</span>
                    </div>
                    <div className="flex py-3 border-b dark:border-gray-700">
                      <span className="font-semibold text-gray-700 dark:text-gray-300 w-48">Phone:</span>
                      <span className="text-gray-900 dark:text-gray-100">{user.emergencyContactNumber || 'Not provided'}</span>
                    </div>
                  </>
                )}
              </div>

              {/* Delete Account Button */}
              <div className="mt-8 pt-6 border-t dark:border-gray-700">
                <button
                  onClick={() => setShowDeleteModal(true)}
                  disabled={deleting}
                  className="px-6 py-3 bg-red-600 text-white rounded-lg font-semibold hover:bg-red-700 disabled:opacity-50 disabled:cursor-not-allowed transition"
                >
                  {deleting ? 'Deleting...' : 'Delete Account'}
                </button>
                <p className="text-sm text-gray-500 dark:text-gray-400 mt-2">
                  Warning: This action cannot be undone.
                </p>
              </div>
            </div>
          )}
        </div>

        {/* Delete Account Modal */}
        <DeleteAccountModal
          isOpen={showDeleteModal}
          onClose={() => setShowDeleteModal(false)}
          onConfirm={handleDeleteAccount}
          isDeleting={deleting}
        />

        {/* Cancel Confirmation Modal */}
        <CancelConfirmationModal
          isOpen={showCancelModal}
          onClose={() => setShowCancelModal(false)}
          onConfirm={handleConfirmCancel}
        />
      </main>
    </div>
  );
}

import { useState, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext';
import { updateProfile, deleteAccount } from '../../services/api';
import { toast } from 'sonner';

interface ProfilePageProps {
  onBack: () => void;
  onLogout: () => void;
  userFullName: string;
  onNavigate?: (page: 'booking' | 'activity-log' | 'about' | 'contact' | 'emergency' | 'user-dashboard' | 'profile') => void;
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
  
  const [formData, setFormData] = useState({
    firstName: '',
    lastName: '',
    phoneNumber: '',
    address: '',
    city: '',
    emergencyContactName: '',
    emergencyContactNumber: '',
  });

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
    }
    if (!formData.lastName || formData.lastName.trim() === '') {
      errors.lastName = 'Last Name is required';
    }
    if (!formData.phoneNumber || formData.phoneNumber.trim() === '') {
      errors.phoneNumber = 'Phone Number is required';
    }
    
    // Required only during initial profile setup
    if (isInitialSetup) {
      if (!formData.address || formData.address.trim() === '') {
        errors.address = 'Address is required';
      }
      if (!formData.city || formData.city.trim() === '') {
        errors.city = 'City is required';
      }
      if (!formData.emergencyContactName || formData.emergencyContactName.trim() === '') {
        errors.emergencyContactName = 'Emergency Contact Name is required';
      }
      if (!formData.emergencyContactNumber || formData.emergencyContactNumber.trim() === '') {
        errors.emergencyContactNumber = 'Emergency Contact Number is required';
      }
    }
    
    if (Object.keys(errors).length > 0) {
      console.error('❌ Validation failed: Missing required fields:', errors);
      setFieldErrors(errors);
      toast.error('Please fill in all required fields marked below');
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
      toast.error('Failed to update profile: ' + (error.response?.data?.message || error.message || 'Unknown error'));
    } finally {
      setLoading(false);
      console.log('✅ Profile update process completed');
    }
  };

  const handleCancel = () => {
    console.log('🔵 Cancel button clicked');
    
    // If profile is incomplete (initial setup), log out the user
    if (!user?.isProfileComplete) {
      const confirmLogout = window.confirm(
        'Are you sure you want to cancel? You will be logged out and need to complete your profile setup next time you login.'
      );
      
      if (confirmLogout) {
        console.log('🚪 Logging out user from profile setup');
        onLogout();
      }
      return;
    }
    
    // If profile is complete, just cancel editing and reset form
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
    console.log('✅ Editing cancelled, returning to view mode');
  };

  const handleDeleteAccount = async () => {
    const confirmDelete = window.confirm(
      'Are you sure you want to delete your account? This action cannot be undone. All your data including pets, bookings, and activity logs will be permanently deleted.'
    );
    
    if (!confirmDelete) {
      console.log('❌ Account deletion cancelled by user');
      return;
    }

    const confirmAgain = window.confirm(
      'FINAL CONFIRMATION: Are you absolutely sure? Type YES in your mind and click OK to proceed with account deletion.'
    );

    if (!confirmAgain) {
      console.log('❌ Account deletion cancelled at final confirmation');
      return;
    }

    setDeleting(true);
    
    try {
      console.log('🗑️ Deleting account...');
      await deleteAccount();
      console.log('✅ Account deleted successfully');
      toast.success('Your account has been deleted successfully. Redirecting...');
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
      <div className="min-h-screen bg-[#FFF9F5] flex items-center justify-center">
        <div className="text-center">Loading...</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#FFF9F5]">
      {/* Navigation Header - Only show if profile is complete */}
      {user.isProfileComplete && (
        <nav className="bg-white border-b px-8 py-3">
          <div className="max-w-7xl mx-auto flex items-center justify-between">
            <div className="flex items-center gap-8">
              <div className="flex items-center gap-2">
                <span className="text-2xl">🐾</span>
              </div>
              <div className="flex items-center gap-6">
                <button 
                  onClick={() => onNavigate?.('user-dashboard')}
                  className="px-4 py-2 hover:bg-gray-100 rounded-full"
                >
                  Home
                </button>
                <button 
                  onClick={() => onDashboardTarget?.('booking')}
                  className="px-4 py-2 hover:bg-gray-100 rounded-full"
                >
                  Booking
                </button>
                <button
                  onClick={() => onDashboardTarget?.('activity-log')}
                  className="px-4 py-2 hover:bg-gray-100 rounded-full"
                >
                  Activity Log
                </button>
                <button
                  onClick={() => onDashboardTarget?.('wellness-timeline')}
                  className="px-4 py-2 hover:bg-gray-100 rounded-full"
                >
                  Timeline
                </button>
                <button
                  onClick={() => onNavigate?.('about')}
                  className="px-4 py-2 hover:bg-gray-100 rounded-full"
                >
                  About
                </button>
                <button
                  onClick={() => onNavigate?.('contact')}
                  className="px-4 py-2 hover:bg-gray-100 rounded-full"
                >
                  Contact
                </button>
              </div>
            </div>
            <div className="flex items-center gap-4">
              <button
                onClick={() => onNavigate?.('profile')}
                className="w-10 h-10 rounded-full hover:shadow-lg transition-all cursor-pointer border-2 border-white overflow-hidden"
                title="View Profile"
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
              <button
                onClick={() => onNavigate?.('emergency')}
                className="px-4 py-2 bg-[#FF6B6B] text-white rounded-full text-sm flex items-center gap-2"
              >
                <span>📞</span> Emergency
              </button>
              <button
                onClick={onLogout}
                className="px-4 py-2 bg-red-50 text-red-600 rounded-full text-sm font-medium hover:bg-red-100 transition-colors"
              >
                Logout
              </button>
            </div>
          </div>
        </nav>
      )}

      {/* Main Content */}
      <main className="max-w-4xl mx-auto px-8 py-8">
        <div className="bg-white rounded-2xl shadow-md p-8">
          <div className="flex justify-between items-center mb-6 pb-4 border-b">
            <h2 className="text-2xl font-bold text-gray-800">
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
            <form onSubmit={handleSubmit} className="space-y-6">
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
                  <p className="text-sm text-gray-500 mt-2">Max size: 5MB</p>
                </div>
              </div>

              {/* Name Fields */}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">First Name *</label>
                  <input
                    type="text"
                    name="firstName"
                    value={formData.firstName}
                    onChange={handleInputChange}
                    className={`w-full px-4 py-3 border-2 rounded-lg focus:outline-none transition ${
                      fieldErrors.firstName ? 'border-red-500 focus:border-red-500' : 'border-gray-200 focus:border-[#FA9884]'
                    }`}
                  />
                  {fieldErrors.firstName && (
                    <p className="text-red-600 text-sm mt-1">{fieldErrors.firstName}</p>
                  )}
                </div>
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">Last Name *</label>
                  <input
                    type="text"
                    name="lastName"
                    value={formData.lastName}
                    onChange={handleInputChange}
                    className={`w-full px-4 py-3 border-2 rounded-lg focus:outline-none transition ${
                      fieldErrors.lastName ? 'border-red-500 focus:border-red-500' : 'border-gray-200 focus:border-[#FA9884]'
                    }`}
                  />
                  {fieldErrors.lastName && (
                    <p className="text-red-600 text-sm mt-1">{fieldErrors.lastName}</p>
                  )}
                </div>
              </div>

              {/* Contact Info */}
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">Phone Number *</label>
                <input
                  type="tel"
                  name="phoneNumber"
                  value={formData.phoneNumber}
                  onChange={handleInputChange}
                  className={`w-full px-4 py-3 border-2 rounded-lg focus:outline-none transition ${
                    fieldErrors.phoneNumber ? 'border-red-500 focus:border-red-500' : 'border-gray-200 focus:border-[#FA9884]'
                  }`}
                />
                {fieldErrors.phoneNumber && (
                  <p className="text-red-600 text-sm mt-1">{fieldErrors.phoneNumber}</p>
                )}
              </div>

              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">Email</label>
                <input
                  type="email"
                  value={user.email}
                  disabled
                  className="w-full px-4 py-3 border-2 border-gray-200 rounded-lg bg-gray-50 text-gray-600 cursor-not-allowed"
                />
              </div>

              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">Address {!user.isProfileComplete && '*'}</label>
                <input
                  type="text"
                  name="address"
                  value={formData.address}
                  onChange={handleInputChange}
                  className={`w-full px-4 py-3 border-2 rounded-lg focus:outline-none transition ${
                    fieldErrors.address ? 'border-red-500 focus:border-red-500' : 'border-gray-200 focus:border-[#FA9884]'
                  }`}
                />
                {fieldErrors.address && (
                  <p className="text-red-600 text-sm mt-1">{fieldErrors.address}</p>
                )}
              </div>

              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">City {!user.isProfileComplete && '*'}</label>
                <input
                  type="text"
                  name="city"
                  value={formData.city}
                  onChange={handleInputChange}
                  className={`w-full px-4 py-3 border-2 rounded-lg focus:outline-none transition ${
                    fieldErrors.city ? 'border-red-500 focus:border-red-500' : 'border-gray-200 focus:border-[#FA9884]'
                  }`}
                />
                {fieldErrors.city && (
                  <p className="text-red-600 text-sm mt-1">{fieldErrors.city}</p>
                )}
              </div>

              {/* Emergency Contact */}
              <div className="pt-6 border-t">
                <h3 className="text-lg font-semibold text-gray-700 mb-4">Emergency Contact {!user.isProfileComplete && '(Required)'}</h3>
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-2">Emergency Contact Name {!user.isProfileComplete && '*'}</label>
                    <input
                      type="text"
                      name="emergencyContactName"
                      value={formData.emergencyContactName}
                      onChange={handleInputChange}
                      className={`w-full px-4 py-3 border-2 rounded-lg focus:outline-none transition ${
                        fieldErrors.emergencyContactName ? 'border-red-500 focus:border-red-500' : 'border-gray-200 focus:border-[#FA9884]'
                      }`}
                    />
                    {fieldErrors.emergencyContactName && (
                      <p className="text-red-600 text-sm mt-1">{fieldErrors.emergencyContactName}</p>
                    )}
                  </div>
                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-2">Emergency Contact Number {!user.isProfileComplete && '*'}</label>
                    <input
                      type="tel"
                      name="emergencyContactNumber"
                      value={formData.emergencyContactNumber}
                      onChange={handleInputChange}
                      className={`w-full px-4 py-3 border-2 rounded-lg focus:outline-none transition ${
                        fieldErrors.emergencyContactNumber ? 'border-red-500 focus:border-red-500' : 'border-gray-200 focus:border-[#FA9884]'
                      }`}
                    />
                    {fieldErrors.emergencyContactNumber && (
                      <p className="text-red-600 text-sm mt-1">{fieldErrors.emergencyContactNumber}</p>
                    )}
                  </div>
                </div>
              </div>

              {/* Form Actions */}
              <div className="flex gap-4 pt-6 border-t">
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
                  className="px-6 py-3 border-2 border-gray-300 text-gray-700 rounded-lg font-semibold hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed transition"
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
                <div className="flex py-3 border-b">
                  <span className="font-semibold text-gray-700 w-48">Name:</span>
                  <span className="text-gray-900">{user.firstName} {user.lastName}</span>
                </div>
                <div className="flex py-3 border-b">
                  <span className="font-semibold text-gray-700 w-48">Email:</span>
                  <span className="text-gray-900">{user.email}</span>
                </div>
                <div className="flex py-3 border-b">
                  <span className="font-semibold text-gray-700 w-48">Phone:</span>
                  <span className="text-gray-900">{user.phoneNumber || 'Not provided'}</span>
                </div>
                <div className="flex py-3 border-b">
                  <span className="font-semibold text-gray-700 w-48">Address:</span>
                  <span className="text-gray-900">{user.address || 'Not provided'}</span>
                </div>
                <div className="flex py-3 border-b">
                  <span className="font-semibold text-gray-700 w-48">City:</span>
                  <span className="text-gray-900">{user.city || 'Not provided'}</span>
                </div>

                {(user.emergencyContactName || user.emergencyContactNumber) && (
                  <>
                    <h3 className="text-lg font-semibold text-gray-700 mt-6 mb-2">Emergency Contact</h3>
                    <div className="flex py-3 border-b">
                      <span className="font-semibold text-gray-700 w-48">Name:</span>
                      <span className="text-gray-900">{user.emergencyContactName || 'Not provided'}</span>
                    </div>
                    <div className="flex py-3 border-b">
                      <span className="font-semibold text-gray-700 w-48">Phone:</span>
                      <span className="text-gray-900">{user.emergencyContactNumber || 'Not provided'}</span>
                    </div>
                  </>
                )}
              </div>

              {/* Delete Account Button */}
              <div className="mt-8 pt-6 border-t">
                <button
                  onClick={handleDeleteAccount}
                  disabled={deleting}
                  className="px-6 py-3 bg-red-600 text-white rounded-lg font-semibold hover:bg-red-700 disabled:opacity-50 disabled:cursor-not-allowed transition"
                >
                  {deleting ? 'Deleting...' : 'Delete Account'}
                </button>
                <p className="text-sm text-gray-500 mt-2">
                  Warning: This action cannot be undone. All your data will be permanently deleted.
                </p>
              </div>
            </div>
          )}
        </div>
      </main>
    </div>
  );
}

import { useState, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext';
import { updateProfile, deleteAccount } from '../../services/api';
import { toast } from 'react-toastify';

interface ProfilePageProps {
  onBack: () => void;
  onLogout: () => void;
  userFullName: string;
}

export default function ProfilePage({ onBack, onLogout, userFullName }: ProfilePageProps) {
  const { user, refreshUserProfile } = useAuth();
  const [editing, setEditing] = useState(false);
  const [loading, setLoading] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [avatarPreview, setAvatarPreview] = useState<string | null>(null);
  const [profilePictureFile, setProfilePictureFile] = useState<File | null>(null);
  
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
      
      // If profile is not complete, force editing mode
      if (!user.isProfileComplete) {
        setEditing(true);
      }
    }
  }, [user]);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
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
    
    // Validation
    if (!formData.firstName || !formData.lastName || !formData.phoneNumber) {
      console.error('❌ Validation failed: Missing required fields');
      alert('Please fill in all required fields (First Name, Last Name, Phone)');
      return;
    }
    
    setLoading(true);
    
    try {
      console.log('📤 Preparing form data for submission...');
      const submitData = new FormData();
      submitData.append('firstName', formData.firstName);
      submitData.append('lastName', formData.lastName);
      submitData.append('phoneNumber', formData.phoneNumber);
      submitData.append('address', formData.address);
      submitData.append('city', formData.city);
      submitData.append('emergencyContactName', formData.emergencyContactName);
      submitData.append('emergencyContactNumber', formData.emergencyContactNumber);
      
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
      
      alert('Profile updated successfully!');
      
      console.log('🔄 Refreshing user profile...');
      await refreshUserProfile();
      
      setEditing(false);
      
      // If this was first-time setup, go back to dashboard
      if (!user?.isProfileComplete) {
        console.log('✅ First-time profile setup complete, navigating back');
        onBack();
      }
    } catch (error: any) {
      console.error('❌ Profile update error:', error);
      console.error('Error details:', {
        message: error.message,
        response: error.response,
        data: error.response?.data
      });
      alert('Failed to update profile: ' + (error.response?.data?.message || error.message || 'Unknown error'));
    } finally {
      setLoading(false);
      console.log('✅ Profile update process completed');
    }
  };

  const handleCancel = () => {
    console.log('🔵 Cancel button clicked');
    // Reset form to original user data
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
    
    // Only allow cancel if profile is already complete
    if (user?.isProfileComplete) {
      setEditing(false);
      console.log('✅ Editing cancelled, returning to view mode');
    } else {
      alert('Please complete your profile before continuing');
      console.log('⚠️ Profile incomplete, cannot cancel');
    }
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
      alert('Your account has been deleted successfully. You will be redirected to the homepage.');
      onLogout(); // This will sign out the user and redirect to landing page
    } catch (error: any) {
      console.error('❌ Account deletion error:', error);
      alert('Failed to delete account: ' + (error.response?.data?.message || error.message || 'Unknown error'));
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
      {/* Navigation Header */}
      <nav className="bg-white border-b px-8 py-3">
        <div className="max-w-7xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-8">
            <span className="text-2xl">🐾</span>
            <h1 className="text-xl font-semibold">Profile</h1>
          </div>
          <div className="flex items-center gap-4">
            <button
              onClick={onBack}
              className="px-4 py-2 border border-gray-300 rounded-full text-sm font-medium hover:bg-gray-50"
            >
              ← Back to Dashboard
            </button>
            <button
              onClick={onLogout}
              className="px-4 py-2 bg-red-50 text-red-600 rounded-full text-sm font-medium hover:bg-red-100"
            >
              Logout
            </button>
          </div>
        </div>
      </nav>

      {/* Main Content */}
      <main className="max-w-4xl mx-auto px-8 py-8">
        <div className="bg-white rounded-2xl shadow-md p-8">
          <div className="flex justify-between items-center mb-6 pb-4 border-b">
            <h2 className="text-2xl font-bold text-gray-800">
              {editing ? (user.isProfileComplete ? 'Edit Profile' : 'Complete Your Profile') : 'My Profile'}
            </h2>
            {user.isProfileComplete && !editing && (
              <button
                onClick={() => setEditing(true)}
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
                    required
                    className="w-full px-4 py-3 border-2 border-gray-200 rounded-lg focus:border-[#FA9884] focus:outline-none transition"
                  />
                </div>
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">Last Name *</label>
                  <input
                    type="text"
                    name="lastName"
                    value={formData.lastName}
                    onChange={handleInputChange}
                    required
                    className="w-full px-4 py-3 border-2 border-gray-200 rounded-lg focus:border-[#FA9884] focus:outline-none transition"
                  />
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
                  required
                  className="w-full px-4 py-3 border-2 border-gray-200 rounded-lg focus:border-[#FA9884] focus:outline-none transition"
                />
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
                <label className="block text-sm font-semibold text-gray-700 mb-2">Address</label>
                <input
                  type="text"
                  name="address"
                  value={formData.address}
                  onChange={handleInputChange}
                  className="w-full px-4 py-3 border-2 border-gray-200 rounded-lg focus:border-[#FA9884] focus:outline-none transition"
                />
              </div>

              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">City</label>
                <input
                  type="text"
                  name="city"
                  value={formData.city}
                  onChange={handleInputChange}
                  className="w-full px-4 py-3 border-2 border-gray-200 rounded-lg focus:border-[#FA9884] focus:outline-none transition"
                />
              </div>

              {/* Emergency Contact */}
              <div className="pt-6 border-t">
                <h3 className="text-lg font-semibold text-gray-700 mb-4">Emergency Contact</h3>
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-2">Emergency Contact Name</label>
                    <input
                      type="text"
                      name="emergencyContactName"
                      value={formData.emergencyContactName}
                      onChange={handleInputChange}
                      className="w-full px-4 py-3 border-2 border-gray-200 rounded-lg focus:border-[#FA9884] focus:outline-none transition"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-2">Emergency Contact Number</label>
                    <input
                      type="tel"
                      name="emergencyContactNumber"
                      value={formData.emergencyContactNumber}
                      onChange={handleInputChange}
                      className="w-full px-4 py-3 border-2 border-gray-200 rounded-lg focus:border-[#FA9884] focus:outline-none transition"
                    />
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
                {user.isProfileComplete && (
                  <button
                    type="button"
                    onClick={handleCancel}
                    disabled={loading}
                    className="px-6 py-3 border-2 border-gray-300 text-gray-700 rounded-lg font-semibold hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed transition"
                  >
                    Cancel
                  </button>
                )}
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

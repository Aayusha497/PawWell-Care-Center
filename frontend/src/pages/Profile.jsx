import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { updateProfile } from '../services/api';
import { toast } from 'react-toastify';
import './Profile.css';

const Profile = () => {
  const { user, refreshUserProfile } = useAuth();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [editing, setEditing] = useState(false);
  const [avatarPreview, setAvatarPreview] = useState(null);
  const [profilePictureFile, setProfilePictureFile] = useState(null);
  
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

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleFileChange = (e) => {
    const file = e.target.files[0];
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
        setAvatarPreview(reader.result);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    // Validation
    if (!formData.firstName || !formData.lastName || !formData.phoneNumber) {
      toast.error('Please fill in all required fields (First Name, Last Name, Phone)');
      return;
    }
    
    setLoading(true);
    
    try {
      const submitData = new FormData();
      submitData.append('firstName', formData.firstName);
      submitData.append('lastName', formData.lastName);
      submitData.append('phoneNumber', formData.phoneNumber);
      submitData.append('address', formData.address);
      submitData.append('city', formData.city);
      submitData.append('emergencyContactName', formData.emergencyContactName);
      submitData.append('emergencyContactNumber', formData.emergencyContactNumber);
      
      if (profilePictureFile) {
        submitData.append('profilePicture', profilePictureFile);
      }

      const response = await updateProfile(submitData);
      
      toast.success('Profile updated successfully!');
      await refreshUserProfile();
      setEditing(false);
      
      // If this was first-time setup, redirect to dashboard
      if (!user.isProfileComplete) {
        navigate('/dashboard');
      }
    } catch (error) {
      console.error('Profile update error:', error);
      toast.error(error.response?.data?.message || 'Failed to update profile');
    } finally {
      setLoading(false);
    }
  };

  const handleCancel = () => {
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
    } else {
      toast.info('Please complete your profile before continuing');
    }
  };

  if (!user) {
    return <div className="profile-container">Loading...</div>;
  }

  return (
    <div className="profile-container">
      <div className="profile-card">
        <div className="profile-header">
          <h1>{editing ? (user.isProfileComplete ? 'Edit Profile' : 'Complete Your Profile') : 'My Profile'}</h1>
          {user.isProfileComplete && !editing && (
            <button 
              className="btn btn-primary"
              onClick={() => setEditing(true)}
            >
              Edit Profile
            </button>
          )}
        </div>

        {editing ? (
          <form onSubmit={handleSubmit} className="profile-form">
            {/* Avatar Upload */}
            <div className="form-group avatar-group">
              <label>Profile Picture</label>
              <div className="avatar-upload">
                <div className="avatar-preview">
                  {avatarPreview ? (
                    <img src={avatarPreview} alt="Profile" />
                  ) : (
                    <div className="avatar-placeholder">
                      {formData.firstName?.charAt(0)?.toUpperCase() || 'U'}
                    </div>
                  )}
                </div>
                <input
                  type="file"
                  id="profilePicture"
                  accept="image/*"
                  onChange={handleFileChange}
                  className="file-input"
                />
                <label htmlFor="profilePicture" className="file-label">
                  Choose Photo
                </label>
              </div>
            </div>

            {/* Name Fields */}
            <div className="form-row">
              <div className="form-group">
                <label>First Name *</label>
                <input
                  type="text"
                  name="firstName"
                  value={formData.firstName}
                  onChange={handleInputChange}
                  required
                  className="form-control"
                />
              </div>
              <div className="form-group">
                <label>Last Name *</label>
                <input
                  type="text"
                  name="lastName"
                  value={formData.lastName}
                  onChange={handleInputChange}
                  required
                  className="form-control"
                />
              </div>
            </div>

            {/* Contact Info */}
            <div className="form-group">
              <label>Phone Number *</label>
              <input
                type="tel"
                name="phoneNumber"
                value={formData.phoneNumber}
                onChange={handleInputChange}
                required
                className="form-control"
              />
            </div>

            <div className="form-group">
              <label>Address</label>
              <input
                type="text"
                name="address"
                value={formData.address}
                onChange={handleInputChange}
                className="form-control"
              />
            </div>

            <div className="form-group">
              <label>City</label>
              <input
                type="text"
                name="city"
                value={formData.city}
                onChange={handleInputChange}
                className="form-control"
              />
            </div>

            {/* Emergency Contact */}
            <div className="form-section">
              <h3>Emergency Contact</h3>
              <div className="form-group">
                <label>Emergency Contact Name</label>
                <input
                  type="text"
                  name="emergencyContactName"
                  value={formData.emergencyContactName}
                  onChange={handleInputChange}
                  className="form-control"
                />
              </div>
              <div className="form-group">
                <label>Emergency Contact Number</label>
                <input
                  type="tel"
                  name="emergencyContactNumber"
                  value={formData.emergencyContactNumber}
                  onChange={handleInputChange}
                  className="form-control"
                />
              </div>
            </div>

            {/* Form Actions */}
            <div className="form-actions">
              <button
                type="submit"
                disabled={loading}
                className="btn btn-primary"
              >
                {loading ? 'Saving...' : 'Save Profile'}
              </button>
              {user.isProfileComplete && (
                <button
                  type="button"
                  onClick={handleCancel}
                  className="btn btn-secondary"
                  disabled={loading}
                >
                  Cancel
                </button>
              )}
            </div>
          </form>
        ) : (
          <div className="profile-view">
            {/* Avatar Display */}
            <div className="profile-avatar-display">
              {user.profilePicture ? (
                <img src={user.profilePicture} alt="Profile" />
              ) : (
                <div className="avatar-placeholder-large">
                  {user.firstName?.charAt(0)?.toUpperCase() || 'U'}
                </div>
              )}
            </div>

            {/* Profile Info Display */}
            <div className="profile-info">
              <div className="info-row">
                <span className="info-label">Name:</span>
                <span className="info-value">{user.firstName} {user.lastName}</span>
              </div>
              <div className="info-row">
                <span className="info-label">Email:</span>
                <span className="info-value">{user.email}</span>
              </div>
              <div className="info-row">
                <span className="info-label">Phone:</span>
                <span className="info-value">{user.phoneNumber || 'Not provided'}</span>
              </div>
              <div className="info-row">
                <span className="info-label">Address:</span>
                <span className="info-value">{user.address || 'Not provided'}</span>
              </div>
              <div className="info-row">
                <span className="info-label">City:</span>
                <span className="info-value">{user.city || 'Not provided'}</span>
              </div>
              
              {(user.emergencyContactName || user.emergencyContactNumber) && (
                <>
                  <h3>Emergency Contact</h3>
                  <div className="info-row">
                    <span className="info-label">Name:</span>
                    <span className="info-value">{user.emergencyContactName || 'Not provided'}</span>
                  </div>
                  <div className="info-row">
                    <span className="info-label">Phone:</span>
                    <span className="info-value">{user.emergencyContactNumber || 'Not provided'}</span>
                  </div>
                </>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default Profile;

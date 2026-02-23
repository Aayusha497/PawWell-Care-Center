import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { updateProfile } from '../services/api';
import { toast } from 'react-toastify';
import './ProfileSetup.css';

const ProfileSetup = () => {
  const { user, refreshUserProfile } = useAuth();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [avatarPreview, setAvatarPreview] = useState(null);
  
  const [formData, setFormData] = useState({
    firstName: '',
    lastName: '',
    phoneNumber: '',
    address: '',
    city: '',
    emergencyContactNumber: '',
    profilePicture: null // We'll handle this as file if backend supports it later, or placeholder for now
  });

  useEffect(() => {
    if (user) {
      setFormData(prev => ({
        ...prev,
        firstName: user.firstName || '',
        lastName: user.lastName || '',
        phoneNumber: user.phoneNumber || '',
        address: user.address || '',
        city: user.city || '',
        emergencyContactNumber: user.emergencyContactNumber || ''
      }));
      if (user.profilePicture) {
        setAvatarPreview(user.profilePicture);
      }
    }
  }, [user]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleFileChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      // In a real app, you'd upload this to Cloudinary or similar
      // For now, we'll just show preview
      const reader = new FileReader();
      reader.onloadend = () => {
        setAvatarPreview(reader.result);
      };
      reader.readAsDataURL(file);
      setFormData(prev => ({ ...prev, profilePicture: file }));
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);

    try {
      // Note: Backend currently accepts JSON body. 
      // If we need to upload image, we would use FormData and a different endpoint or handle it in updateProfile
      // For this implementation, we send text fields.
      
      const payload = {
        firstName: formData.firstName,
        lastName: formData.lastName,
        phoneNumber: formData.phoneNumber,
        address: formData.address,
        city: formData.city,
        emergencyContactNumber: formData.emergencyContactNumber
      };

      const response = await updateProfile(payload);
      
      if (response.success) {
        toast.success('Profile updated successfully!');
        if (refreshUserProfile) await refreshUserProfile(); // Refresh context
        navigate('/dashboard');
      }
    } catch (error) {
      console.error('Profile update error:', error);
      toast.error(error.message || 'Failed to update profile');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="profile-setup-container">
      <div className="profile-setup-card">
        <div className="profile-header">
          <h1>Profile Setup</h1>
          <p>Complete your profile to access all features</p>
        </div>

        <form onSubmit={handleSubmit}>
          <div className="profile-avatar-upload">
            <label htmlFor="avatar-input" style={{ cursor: 'pointer', display: 'block', height: '100%' }}>
              {avatarPreview ? (
                <img src={avatarPreview} alt="Profile" className="avatar-preview" />
              ) : (
                <div className="avatar-placeholder">
                  <span>📷</span>
                </div>
              )}
              <div className="upload-overlay">
                <span>+</span>
              </div>
            </label>
            <input 
              id="avatar-input"
              type="file" 
              accept="image/*" 
              onChange={handleFileChange}
              style={{ display: 'none' }}
            />
          </div>

          <div className="form-grid">
            <div className="form-group">
              <label htmlFor="firstName">First Name</label>
              <input
                type="text"
                id="firstName"
                name="firstName"
                value={formData.firstName}
                onChange={handleChange}
                required
                className="form-control"
              />
            </div>

            <div className="form-group">
              <label htmlFor="lastName">Last Name</label>
              <input
                type="text"
                id="lastName"
                name="lastName"
                value={formData.lastName}
                onChange={handleChange}
                required
                className="form-control"
              />
            </div>

            <div className="form-group">
              <label htmlFor="phoneNumber">Phone Number</label>
              <input
                type="tel"
                id="phoneNumber"
                name="phoneNumber"
                value={formData.phoneNumber}
                onChange={handleChange}
                required
                className="form-control"
              />
            </div>

            <div className="form-group">
              <label htmlFor="city">City</label>
              <input
                type="text"
                id="city"
                name="city"
                value={formData.city}
                onChange={handleChange}
                required
                className="form-control"
              />
            </div>

            <div className="form-group full-width">
              <label htmlFor="address">Address</label>
              <input
                type="text"
                id="address"
                name="address"
                value={formData.address}
                onChange={handleChange}
                required
                className="form-control"
              />
            </div>

            <div className="form-group full-width">
              <label htmlFor="emergencyContactNumber">Emergency Contact Number</label>
              <input
                type="tel"
                id="emergencyContactNumber"
                name="emergencyContactNumber"
                value={formData.emergencyContactNumber}
                onChange={handleChange}
                required
                className="form-control"
                placeholder="Someone we can call in case of emergency"
              />
            </div>
          </div>

          <div className="form-actions">
            <button 
              type="button" 
              className="btn btn-secondary"
              onClick={() => navigate('/dashboard')}
            >
              Cancel
            </button>
            <button 
              type="submit" 
              className="btn btn-primary" 
              disabled={loading}
            >
              {loading ? 'Saving...' : 'Save Profile'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default ProfileSetup;

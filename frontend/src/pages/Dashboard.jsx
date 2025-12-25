/**
 * Dashboard Page
 * 
 * Protected page - only accessible to authenticated users
 */

import React from 'react';
import { useAuth } from '../context/AuthContext';
import { useNavigate } from 'react-router-dom';
import { logoutUser } from '../services/api';
import { toast } from 'react-toastify';

const Dashboard = () => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  const handleLogout = async () => {
    try {
      await logoutUser();
      logout();
      toast.success('Logged out successfully');
      navigate('/login');
    } catch (error) {
      toast.error('Logout failed');
      // Still logout locally even if API call fails
      logout();
      navigate('/login');
    }
  };

  return (
    <div className="dashboard-page">
      <div className="dashboard-container">
        <h1>Welcome to PawWell Care Center</h1>
        
        {user && (
          <div className="user-info-card">
            <h2>Your Profile</h2>
            <div className="info-row">
              <span className="label">Name:</span>
              <span className="value">{user.first_name} {user.last_name}</span>
            </div>
            <div className="info-row">
              <span className="label">Email:</span>
              <span className="value">{user.email}</span>
            </div>
            <div className="info-row">
              <span className="label">User Type:</span>
              <span className="value">{user.user_type}</span>
            </div>
            <div className="info-row">
              <span className="label">Member Since:</span>
              <span className="value">
                {new Date(user.date_joined).toLocaleDateString()}
              </span>
            </div>
          </div>
        )}

        <div className="dashboard-actions">
          <button onClick={handleLogout} className="btn btn-secondary">
            Logout
          </button>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;

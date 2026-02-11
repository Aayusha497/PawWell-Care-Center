/**
 * Dashboard Page
 * 
 * User Dashboard UI following Figma design
 * Displays pets, bookings, and activity with real API data
 */

import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { useNavigate } from 'react-router-dom';
import { getUserPets, getActivityLogs } from '../services/api';
import DashboardLayout from '../components/DashboardLayout';
import DashboardCard from '../components/DashboardCard';
import PetCard from '../components/PetCard';
import BookingCard from '../components/BookingCard';
import ActivityCard from '../components/ActivityCard';
import './Dashboard.css';

const Dashboard = () => {
  const { user } = useAuth();
  const navigate = useNavigate();

  // State management
  const [pets, setPets] = useState([]);
  const [bookings, setBookings] = useState([]);
  const [activities, setActivities] = useState([]);
  const [loading, setLoading] = useState({
    pets: true,
    bookings: true,
    activities: true
  });
  const [errors, setErrors] = useState({
    pets: null,
    bookings: null,
    activities: null
  });

  // Fetch user pets
  useEffect(() => {
    const fetchPets = async () => {
      try {
        setLoading(prev => ({ ...prev, pets: true }));
        const response = await getUserPets();
        
        if (response.success && response.pets) {
          setPets(response.pets);
        } else {
          setPets([]);
        }
      } catch (error) {
        console.error('Error fetching pets:', error);
        setErrors(prev => ({ ...prev, pets: error.message || 'Failed to load pets' }));
        setPets([]);
      } finally {
        setLoading(prev => ({ ...prev, pets: false }));
      }
    };

    fetchPets();
  }, []);

  // Fetch bookings - placeholder for future implementation
  useEffect(() => {
    const fetchBookings = async () => {
      try {
        setLoading(prev => ({ ...prev, bookings: true }));
        // TODO: Implement when booking API endpoint is available
        // For now, showing empty state
        setBookings([]);
      } catch (error) {
        console.error('Error fetching bookings:', error);
        setErrors(prev => ({ ...prev, bookings: error.message }));
      } finally {
        setLoading(prev => ({ ...prev, bookings: false }));
      }
    };

    fetchBookings();
  }, []);

  // Fetch activity logs
  useEffect(() => {
    const fetchActivities = async () => {
      try {
        setLoading(prev => ({ ...prev, activities: true }));
        const response = await getActivityLogs();
        
        if (response.success && response.data) {
          setActivities(response.data);
        } else {
          setActivities([]);
        }
      } catch (error) {
        console.error('Error fetching activities:', error);
        setErrors(prev => ({ ...prev, activities: error.message || 'Failed to load activities' }));
        setActivities([]);
      } finally {
        setLoading(prev => ({ ...prev, activities: false }));
      }
    };

    fetchActivities();
  }, []);

  const handleBookService = () => {
    // TODO: Navigate to booking page when implemented
    // For now, show a placeholder message
    console.log('Booking feature coming soon');
    // navigate('/booking');
  };

  const handleAddPet = () => {
    navigate('/pets/add');
  };

  const handleViewAllPets = () => {
    navigate('/pets');
  };

  const handleViewActivityLog = () => {
    navigate('/activity-log');
  };

  return (
    <DashboardLayout>
      <div className="user-dashboard">
        {/* Header Section */}
        <div className="dashboard-header">
          <h1 className="dashboard-title">
            Welcome{user?.first_name ? `, ${user.first_name}` : ''}!
          </h1>
        </div>

        {/* Main Dashboard Grid */}
        <div className="dashboard-grid">
          {/* Welcome Card */}
          <div className="dashboard-welcome-section">
            <DashboardCard className="welcome-card">
              <div className="welcome-content">
                <h2 className="welcome-heading">
                  Welcome{user?.first_name ? `, ${user.first_name}` : ''}!
                </h2>
                <p className="welcome-description">
                  Manage your pets and book services with ease.
                </p>
                <div className="welcome-actions">
                  <button 
                    className="btn btn-primary-dashboard" 
                    onClick={handleBookService}
                  >
                    Book a New Service
                  </button>
                  <button 
                    className="btn btn-secondary-dashboard" 
                    onClick={handleAddPet}
                  >
                    + Add a New Pet
                  </button>
                </div>
              </div>
            </DashboardCard>
          </div>

          {/* My Pets Section */}
          <div className="dashboard-pets-section">
            <DashboardCard 
              title="My Pets"
              headerAction={
                pets.length > 0 && (
                  <button 
                    className="btn-link" 
                    onClick={handleViewAllPets}
                  >
                    View All
                  </button>
                )
              }
            >
              {loading.pets ? (
                <div className="loading-state">
                  <div className="spinner"></div>
                  <p>Loading pets...</p>
                </div>
              ) : errors.pets ? (
                <div className="error-state">
                  <p className="error-message">{errors.pets}</p>
                </div>
              ) : pets.length === 0 ? (
                <div className="empty-state">
                  <p className="empty-message">You haven't added any pets yet.</p>
                  <button 
                    className="btn btn-primary-small" 
                    onClick={handleAddPet}
                  >
                    Add Your First Pet
                  </button>
                </div>
              ) : (
                <div className="pets-grid">
                  {pets.slice(0, 4).map((pet) => (
                    <PetCard key={pet.pet_id} pet={pet} />
                  ))}
                </div>
              )}
            </DashboardCard>
          </div>
        </div>

        {/* Bottom Grid - Bookings and Activity */}
        <div className="dashboard-bottom-grid">
          {/* Upcoming Bookings */}
          <DashboardCard 
            title="Upcoming Bookings"
            className="bookings-card"
          >
            {loading.bookings ? (
              <div className="loading-state">
                <div className="spinner"></div>
                <p>Loading bookings...</p>
              </div>
            ) : errors.bookings ? (
              <div className="error-state">
                <p className="error-message">{errors.bookings}</p>
              </div>
            ) : bookings.length === 0 ? (
              <div className="empty-state">
                <p className="empty-message">No upcoming bookings.</p>
                <button 
                  className="btn btn-primary-small" 
                  onClick={handleBookService}
                >
                  Book a Service
                </button>
              </div>
            ) : (
              <div className="bookings-list">
                {bookings.slice(0, 3).map((booking) => (
                  <BookingCard key={booking.booking_id} booking={booking} />
                ))}
              </div>
            )}
          </DashboardCard>

          {/* Recent Activity */}
          <DashboardCard 
            title="Recent Activity"
            className="activity-card"
            headerAction={
              activities.length > 0 && (
                <button 
                  className="btn-link"
                  onClick={handleViewActivityLog}
                >
                  View Daily log
                </button>
              )
            }
          >
            {loading.activities ? (
              <div className="loading-state">
                <div className="spinner"></div>
                <p>Loading activity...</p>
              </div>
            ) : errors.activities ? (
              <div className="error-state">
                <p className="error-message">{errors.activities}</p>
              </div>
            ) : activities.length === 0 ? (
              <div className="empty-state">
                <p className="empty-message">No recent activity.</p>
              </div>
            ) : (
              <div className="activities-list">
                {activities.slice(0, 5).map((activity) => (
                  <ActivityCard key={activity.activity_id} activity={activity} />
                ))}
              </div>
            )}
          </DashboardCard>
        </div>
      </div>
    </DashboardLayout>
  );
};

export default Dashboard;

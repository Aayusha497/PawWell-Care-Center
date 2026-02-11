/**
 * Activity Log Page
 * 
 * Page for viewing and creating pet activity logs (feeding, walks, grooming, etc.)
 */

import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { 
  createActivityLog, 
  getActivityLogs, 
  getUserPets,
  deleteActivityLog,
  updateActivityLog 
} from '../services/api';
import { toast } from 'react-toastify';
import './ActivityLog.css';

const ActivityLog = () => {
  const { user } = useAuth();
  const [pets, setPets] = useState([]);
  const [activityLogs, setActivityLogs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [selectedPet, setSelectedPet] = useState('');
  const [activityType, setActivityType] = useState('');
  const [description, setDescription] = useState('');
  const [photo, setPhoto] = useState(null);
  const [photoPreview, setPhotoPreview] = useState(null);
  const [notifyOwner, setNotifyOwner] = useState(false);
  const [filterPet, setFilterPet] = useState('');
  const [filterDate, setFilterDate] = useState('');

  const activityTypes = [
    { value: 'feeding', label: 'Feeding' },
    { value: 'walk', label: 'Walk' },
    { value: 'playtime', label: 'Playtime' },
    { value: 'medication', label: 'Medication' },
    { value: 'grooming', label: 'Grooming' },
    { value: 'training', label: 'Training' },
    { value: 'veterinary', label: 'Veterinary Visit' },
    { value: 'other', label: 'Other Activity' },
  ];

  const activityTypeMap = {
    'feeding': 'Feeding',
    'walk': 'Walk',
    'playtime': 'Playtime',
    'medication': 'Medication',
    'grooming': 'Grooming',
    'training': 'Training',
    'veterinary': 'Veterinary Visit',
    'other': 'Other Activity'
  };

  const isStaffOrAdmin = user?.user_type === 'admin' || user?.user_type === 'staff';

  useEffect(() => {
    fetchData();
  }, [filterPet, filterDate]);

  const fetchData = async () => {
    try {
      setLoading(true);
      
      // Fetch pets
      const petsResponse = await getUserPets();
      setPets(petsResponse.data || []);

      // Fetch activity logs with filters
      const filters = {};
      if (filterPet) filters.pet_id = filterPet;
      if (filterDate) filters.date = filterDate;
      
      const logsResponse = await getActivityLogs(filters);
      setActivityLogs(logsResponse.data || []);
    } catch (error) {
      console.error('Error fetching data:', error);
      toast.error(error.message || 'Failed to load data');
    } finally {
      setLoading(false);
    }
  };

  const handlePhotoChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      setPhoto(file);
      const reader = new FileReader();
      reader.onloadend = () => {
        setPhotoPreview(reader.result);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!isStaffOrAdmin) {
      toast.error('Only staff and admin can create activity logs');
      return;
    }

    if (!selectedPet || !activityType || !description.trim()) {
      toast.error('Please fill in all required fields (Pet, Activity Type, and Description)');
      return;
    }

    if (description.trim().length < 5) {
      toast.error('Description must be at least 5 characters');
      return;
    }

    try {
      setSubmitting(true);

      const formData = new FormData();
      formData.append('pet_id', selectedPet);
      formData.append('activity_type', activityType);
      formData.append('description', description);
      formData.append('notify_owner', notifyOwner);
      
      if (photo) {
        formData.append('photo', photo);
      }

      await createActivityLog(formData);
      
      toast.success('Activity logged successfully!');
      
      // Reset form
      setSelectedPet('');
      setActivityType('');
      setDescription('');
      setPhoto(null);
      setPhotoPreview(null);
      setNotifyOwner(false);

      // Refresh activity logs
      await fetchData();
    } catch (error) {
      console.error('Error creating activity log:', error);
      toast.error(error.message || 'Failed to log activity');
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = async (logId) => {
    if (!window.confirm('Are you sure you want to delete this activity log?')) {
      return;
    }

    try {
      await deleteActivityLog(logId);
      toast.success('Activity log deleted successfully');
      await fetchData();
    } catch (error) {
      console.error('Error deleting activity log:', error);
      toast.error(error.message || 'Failed to delete activity log');
    }
  };

  const getTimeFormat = (dateString) => {
    const date = new Date(dateString);
    return date.toLocaleTimeString('en-US', { 
      hour: 'numeric', 
      minute: '2-digit',
      hour12: true 
    });
  };

  const groupLogsByDate = (logs) => {
    const groups = {};
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    
    const yesterday = new Date(today);
    yesterday.setDate(yesterday.getDate() - 1);

    logs.forEach(log => {
      const logDate = new Date(log.timestamp);
      logDate.setHours(0, 0, 0, 0);

      let groupKey;
      if (logDate.getTime() === today.getTime()) {
        groupKey = 'Today';
      } else if (logDate.getTime() === yesterday.getTime()) {
        groupKey = 'Yesterday';
      } else {
        groupKey = logDate.toLocaleDateString('en-US', { 
          month: 'long', 
          day: 'numeric',
          year: 'numeric'
        });
      }

      if (!groups[groupKey]) {
        groups[groupKey] = [];
      }
      groups[groupKey].push(log);
    });

    return groups;
  };

  const groupedLogs = groupLogsByDate(activityLogs);

  return (
    <div className="activity-log-page">
      <div className="activity-log-container">
        <h1 className="page-title">Daily Activity Log</h1>

          {/* Add New Activity Form - Only for Staff/Admin */}
          {isStaffOrAdmin && (
            <div className="activity-form-card">
              <h2 className="form-title">Add New Activity</h2>
              <form onSubmit={handleSubmit} className="activity-form">
                <div className="form-row">
                  <div className="form-group">
                    <select
                      value={selectedPet}
                      onChange={(e) => setSelectedPet(e.target.value)}
                      className="form-select"
                      required
                    >
                      <option value="">Select Pet</option>
                      {pets.map((pet) => (
                        <option key={pet.pet_id} value={pet.pet_id}>
                          {pet.name}
                          {isStaffOrAdmin && pet.owner && ` (${pet.owner.first_name} ${pet.owner.last_name})`}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div className="form-group">
                    <select
                      value={activityType}
                      onChange={(e) => setActivityType(e.target.value)}
                      className="form-select"
                      required
                    >
                      <option value="">Activity Type</option>
                      {activityTypes.map((type) => (
                        <option key={type.value} value={type.value}>
                          {type.label}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>

                <div className="form-group">
                  <textarea
                    value={description}
                    onChange={(e) => setDescription(e.target.value)}
                    className="form-textarea"
                    placeholder="What did the pet do? Describe the mood, activity and any observations."
                    rows="4"
                    required
                    minLength="5"
                  />
                  <small className="char-counter">
                    {description.length} characters {description.length < 5 && '(minimum 5 required)'}
                  </small>
                </div>

                <div className="form-group">
                  <label htmlFor="photo-upload" className="photo-upload-btn">
                    <span>📤</span>
                    <span>Upload Photo</span>
                  </label>
                  <input
                    id="photo-upload"
                    type="file"
                    accept="image/*"
                    onChange={handlePhotoChange}
                    className="file-input"
                  />
                  {photoPreview && (
                    <div className="photo-preview">
                      <img src={photoPreview} alt="Preview" />
                      <button
                        type="button"
                        onClick={() => {
                          setPhoto(null);
                          setPhotoPreview(null);
                        }}
                        className="remove-photo-btn"
                      >
                        ✕
                      </button>
                    </div>
                  )}
                </div>

                <div className="form-group">
                  <label className="checkbox-label">
                    <input
                      type="checkbox"
                      checked={notifyOwner}
                      onChange={(e) => setNotifyOwner(e.target.checked)}
                    />
                    <span>Notify Owner</span>
                  </label>
                </div>

                <button 
                  type="submit" 
                  className="submit-btn"
                  disabled={submitting}
                >
                  {submitting ? 'Logging Activity...' : 'Log Activity'}
                </button>
              </form>
            </div>
          )}

          {/* Filters */}
          <div className="filters-section">
            <div className="filter-group">
              <select
                value={filterPet}
                onChange={(e) => setFilterPet(e.target.value)}
                className="filter-select"
              >
                <option value="">All Pets</option>
                {pets.map((pet) => (
                  <option key={pet.pet_id} value={pet.pet_id}>
                    {pet.name}
                  </option>
                ))}
              </select>
            </div>
            <div className="filter-group">
              <input
                type="date"
                value={filterDate}
                onChange={(e) => setFilterDate(e.target.value)}
                className="filter-select"
              />
              {filterDate && (
                <button
                  onClick={() => setFilterDate('')}
                  className="clear-filter-btn"
                >
                  Clear
                </button>
              )}
            </div>
          </div>

          {/* Activity Timeline */}
          {loading ? (
            <div className="loading-state">
              <p>Loading activities...</p>
            </div>
          ) : Object.keys(groupedLogs).length === 0 ? (
            <div className="empty-state">
              {isStaffOrAdmin ? (
                <>
                  <p className="empty-title">No activity logs yet</p>
                  <p className="empty-description">Create the first activity log above to start tracking your pets' daily activities!</p>
                </>
              ) : (
                <>
                  <p className="empty-title">No activity updates yet</p>
                  <p className="empty-description">Your pet's daily activities will appear here once our caretakers log them. Check back soon for updates on feeding, walks, playtime, and more!</p>
                </>
              )}
            </div>
          ) : (
            <div className="timeline-section">
              {Object.entries(groupedLogs).map(([dateGroup, logs]) => (
                <div key={dateGroup} className="timeline-group">
                  <h3 className="timeline-date">{dateGroup}</h3>
                  <div className="timeline-cards">
                    {logs.map((log) => (
                      <div key={log.activity_id} className="activity-card">
                        <div className="activity-card-header">
                          <div className="activity-info">
                            <h4 className="activity-type">
                              {activityTypeMap[log.activity_type] || log.activity_type}
                            </h4>
                            <p className="pet-name">{log.pet?.name}</p>
                          </div>
                          {log.notified && (
                            <span className="notified-badge">Notified</span>
                          )}
                          {isStaffOrAdmin && log.user_id === user?.id && (
                            <button
                              onClick={() => handleDelete(log.activity_id)}
                              className="delete-btn"
                              title="Delete activity"
                            >
                              🗑️
                            </button>
                          )}
                        </div>

                        {log.photo && (
                          <div className="activity-photo">
                            <img src={log.photo} alt={log.activity_type} />
                          </div>
                        )}

                        <div className="activity-content">
                          {log.detail && (
                            <p className="activity-description">{log.detail}</p>
                          )}
                          <p className="activity-time">{getTimeFormat(log.timestamp)}</p>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
  );
};
export default ActivityLog;

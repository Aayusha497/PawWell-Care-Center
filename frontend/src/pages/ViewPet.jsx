/**
 * View Pet Page
 * 
 * Displays detailed information about a single pet
 */

import React, { useState, useEffect } from 'react';
import { useNavigate, useParams, useLocation } from 'react-router-dom';
import { getPetById, deletePet } from '../services/api';
import './ViewPet.css';

const ViewPet = () => {
  const [pet, setPet] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [successMessage, setSuccessMessage] = useState('');
  const [deleteConfirm, setDeleteConfirm] = useState(false);
  const navigate = useNavigate();
  const { petId } = useParams();
  const location = useLocation();

  useEffect(() => {
    fetchPet();
    
    // Check for success message from navigation state
    if (location.state?.successMessage) {
      setSuccessMessage(location.state.successMessage);
      setTimeout(() => setSuccessMessage(''), 3000);
      // Clear state
      window.history.replaceState({}, document.title);
    }
  }, [petId]);

  const fetchPet = async () => {
    try {
      setLoading(true);
      setError(null);
      const response = await getPetById(petId);
      setPet(response.data);
    } catch (err) {
      console.error('Error fetching pet:', err);
      setError(err.message || 'Failed to fetch pet');
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async () => {
    try {
      setError(null);
      await deletePet(petId);
      navigate('/pets', { 
        state: { successMessage: 'Pet profile deleted successfully!' } 
      });
    } catch (err) {
      console.error('Error deleting pet:', err);
      setError(err.message || 'Failed to delete pet');
      setDeleteConfirm(false);
    }
  };

  if (loading) {
    return (
      <div className="view-pet-container">
        <div className="loading">Loading pet details...</div>
      </div>
    );
  }

  if (error && !pet) {
    return (
      <div className="view-pet-container">
        <div className="alert alert-error">
          {error}
        </div>
        <button onClick={() => navigate('/pets')} className="btn btn-secondary">
          Back to Pets
        </button>
      </div>
    );
  }

  return (
    <div className="view-pet-container">
      <div className="page-header">
        <button 
          onClick={() => navigate('/pets')} 
          className="back-button"
        >
          ← Back to Pets
        </button>
      </div>

      {successMessage && (
        <div className="alert alert-success">
          {successMessage}
        </div>
      )}

      {error && (
        <div className="alert alert-error">
          {error}
        </div>
      )}

      <div className="pet-details-card">
        <div className="pet-photo-section">
          <img src={pet.photo} alt={pet.name} />
        </div>

        <div className="pet-info-section">
          <div className="pet-header">
            <h1>{pet.name}</h1>
            <div className="pet-actions">
              <button 
                onClick={() => navigate(`/pets/${petId}/edit`)}
                className="btn btn-primary"
              >
                ✏️ Edit Profile
              </button>
              <button 
                onClick={() => setDeleteConfirm(true)}
                className="btn btn-danger"
              >
                🗑️ Delete
              </button>
            </div>
          </div>

          <div className="pet-details-grid">
            <div className="detail-item">
              <span className="detail-label">Breed</span>
              <span className="detail-value">{pet.breed}</span>
            </div>

            <div className="detail-item">
              <span className="detail-label">Age</span>
              <span className="detail-value">{pet.age} years</span>
            </div>

            <div className="detail-item">
              <span className="detail-label">Sex</span>
              <span className="detail-value">{pet.sex}</span>
            </div>

            <div className="detail-item">
              <span className="detail-label">Weight</span>
              <span className="detail-value">{pet.weight} kg</span>
            </div>

            <div className="detail-item">
              <span className="detail-label">Height</span>
              <span className="detail-value">{pet.height} cm</span>
            </div>
          </div>

          {pet.allergies && (
            <div className="detail-section">
              <h3>Allergies</h3>
              <p>{pet.allergies}</p>
            </div>
          )}

          {pet.triggering_point && (
            <div className="detail-section">
              <h3>Triggering Points</h3>
              <p>{pet.triggering_point}</p>
            </div>
          )}

          {pet.medical_history && (
            <div className="detail-section">
              <h3>Medical History</h3>
              <p>{pet.medical_history}</p>
            </div>
          )}

          <div className="pet-meta">
            <p><small>Created: {new Date(pet.created_at).toLocaleDateString()}</small></p>
            <p><small>Last Updated: {new Date(pet.updated_at).toLocaleDateString()}</small></p>
          </div>
        </div>
      </div>

      {/* Delete Confirmation Modal */}
      {deleteConfirm && (
        <div className="modal-overlay">
          <div className="modal">
            <h3>Delete {pet.name}?</h3>
            <p>Are you sure you want to delete this pet profile? This action cannot be undone.</p>
            <div className="modal-actions">
              <button
                onClick={handleDelete}
                className="btn btn-danger"
              >
                Yes, Delete
              </button>
              <button
                onClick={() => setDeleteConfirm(false)}
                className="btn btn-secondary"
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default ViewPet;

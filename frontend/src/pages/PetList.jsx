/**
 * Pet List Page
 * 
 * Displays all pets for the logged-in user with options to add, view, edit, delete
 */

import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { getUserPets, deletePet } from '../services/api';
import './PetList.css';

const PetList = () => {
  const [pets, setPets] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [successMessage, setSuccessMessage] = useState('');
  const [deleteConfirm, setDeleteConfirm] = useState(null);
  const navigate = useNavigate();

  // Fetch pets on component mount
  useEffect(() => {
    fetchPets();
  }, []);

  const fetchPets = async () => {
    try {
      setLoading(true);
      setError(null);
      const response = await getUserPets();
      setPets(response.data || []);
    } catch (err) {
      console.error('Error fetching pets:', err);
      setError(err.message || 'Failed to fetch pets');
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (petId) => {
    try {
      setError(null);
      await deletePet(petId);
      setSuccessMessage('Pet profile deleted successfully');
      setTimeout(() => setSuccessMessage(''), 3000);
      setDeleteConfirm(null);
      // Refresh list
      fetchPets();
    } catch (err) {
      console.error('Error deleting pet:', err);
      setError(err.message || 'Failed to delete pet');
      setDeleteConfirm(null);
    }
  };

  if (loading) {
    return (
      <div className="pet-list-container">
        <div className="loading">Loading your pets...</div>
      </div>
    );
  }

  return (
    <div className="pet-list-container">
      <div className="pet-list-header">
        <h1>My Pets</h1>
        <Link to="/pets/add" className="btn btn-primary">
          <span className="icon">+</span> Add New Pet
        </Link>
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

      {pets.length === 0 ? (
        <div className="empty-state">
          <div className="empty-icon">🐾</div>
          <h2>No pets yet</h2>
          <p>Add your first pet profile to get started!</p>
          <Link to="/pets/add" className="btn btn-primary">
            Add Your First Pet
          </Link>
        </div>
      ) : (
        <div className="pet-grid">
          {pets.map((pet) => (
            <div key={pet.pet_id} className="pet-card">
              <div className="pet-photo">
                <img src={pet.photo} alt={pet.name} />
              </div>
              <div className="pet-info">
                <h3>{pet.name}</h3>
                <div className="pet-details">
                  <p><strong>Breed:</strong> {pet.breed}</p>
                  <p><strong>Age:</strong> {pet.age} years</p>
                  <p><strong>Sex:</strong> {pet.sex}</p>
                  <p><strong>Weight:</strong> {pet.weight} kg</p>
                </div>
              </div>
              <div className="pet-actions">
                <button
                  onClick={() => navigate(`/pets/${pet.pet_id}`)}
                  className="btn btn-secondary"
                >
                  View Details
                </button>
                <button
                  onClick={() => navigate(`/pets/${pet.pet_id}/edit`)}
                  className="btn btn-info"
                >
                  Edit
                </button>
                <button
                  onClick={() => setDeleteConfirm(pet.pet_id)}
                  className="btn btn-danger"
                >
                  Delete
                </button>
              </div>

              {/* Delete Confirmation Modal */}
              {deleteConfirm === pet.pet_id && (
                <div className="modal-overlay">
                  <div className="modal">
                    <h3>Delete {pet.name}?</h3>
                    <p>Are you sure you want to delete this pet profile? This action cannot be undone.</p>
                    <div className="modal-actions">
                      <button
                        onClick={() => handleDelete(pet.pet_id)}
                        className="btn btn-danger"
                      >
                        Yes, Delete
                      </button>
                      <button
                        onClick={() => setDeleteConfirm(null)}
                        className="btn btn-secondary"
                      >
                        Cancel
                      </button>
                    </div>
                  </div>
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default PetList;

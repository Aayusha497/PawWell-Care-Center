/**
 * Edit Pet Page
 * 
 * Page for editing an existing pet profile
 */

import React, { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import PetForm from '../components/PetForm';
import { getPetById, updatePet } from '../services/api';
import './EditPet.css';

const EditPet = () => {
  const [pet, setPet] = useState(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState(null);
  const navigate = useNavigate();
  const { petId } = useParams();

  useEffect(() => {
    fetchPet();
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

  const handleSubmit = async (formData) => {
    try {
      setSaving(true);
      setError(null);

      await updatePet(petId, formData);
      
      // Navigate to pet details with success message
      navigate(`/pets/${petId}`, { 
        state: { successMessage: 'Pet profile updated successfully!' } 
      });
    } catch (err) {
      console.error('Error updating pet:', err);
      setError(err.message || 'Failed to update pet profile');
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="edit-pet-container">
        <div className="loading">Loading pet details...</div>
      </div>
    );
  }

  if (error && !pet) {
    return (
      <div className="edit-pet-container">
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
    <div className="edit-pet-container">
      <div className="page-header">
        <button 
          onClick={() => navigate(`/pets/${petId}`)} 
          className="back-button"
        >
          ← Back to {pet?.name}'s Profile
        </button>
        <h1>Edit {pet?.name}'s Profile</h1>
      </div>

      {error && (
        <div className="alert alert-error">
          {error}
        </div>
      )}

      <PetForm 
        initialData={pet}
        onSubmit={handleSubmit} 
        isLoading={saving}
      />
    </div>
  );
};

export default EditPet;

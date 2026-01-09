/**
 * Add Pet Page
 * 
 * Page for creating a new pet profile
 */

import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import PetForm from '../components/PetForm';
import { createPet } from '../services/api';
import './AddPet.css';

const AddPet = () => {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const navigate = useNavigate();

  const handleSubmit = async (formData) => {
    try {
      setLoading(true);
      setError(null);

      const response = await createPet(formData);
      
      // Navigate to pet list with success message
      navigate('/pets', { 
        state: { successMessage: 'Pet profile created successfully!' } 
      });
    } catch (err) {
      console.error('Error creating pet:', err);
      setError(err.message || 'Failed to create pet profile');
      setLoading(false);
    }
  };

  return (
    <div className="add-pet-container">
      <div className="page-header">
        <button 
          onClick={() => navigate('/pets')} 
          className="back-button"
        >
          ← Back to Pets
        </button>
        <h1>Add New Pet Profile</h1>
      </div>

      {error && (
        <div className="alert alert-error">
          {error}
        </div>
      )}

      <PetForm 
        onSubmit={handleSubmit} 
        isLoading={loading}
      />
    </div>
  );
};

export default AddPet;

/**
 * Pet Card Component
 * 
 * Displays pet information in card format
 */

import React from 'react';
import { useNavigate } from 'react-router-dom';

const PetCard = ({ pet }) => {
  const navigate = useNavigate();

  const handleCardClick = () => {
    navigate(`/pets/${pet.pet_id}`);
  };

  // Fallback image - using a data URI for a simple paw print placeholder
  const placeholderImage = "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='200' height='200' viewBox='0 0 200 200'%3E%3Crect fill='%23FFE4A3' width='200' height='200'/%3E%3Ctext x='50%25' y='50%25' dominant-baseline='middle' text-anchor='middle' font-size='60' fill='%23FA9884'%3E🐾%3C/text%3E%3C/svg%3E";

  return (
    <div className="pet-card" onClick={handleCardClick}>
      <div className="pet-card-image-wrapper">
        <img 
          src={pet.photo || placeholderImage} 
          alt={pet.name}
          className="pet-card-image"
          onError={(e) => {
            e.target.src = placeholderImage;
          }}
        />
      </div>
      <div className="pet-card-info">
        <h4 className="pet-card-name">{pet.name}</h4>
        <p className="pet-card-breed">{pet.breed}</p>
      </div>
    </div>
  );
};

export default PetCard;

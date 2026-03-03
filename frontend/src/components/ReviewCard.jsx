/**
 * ReviewCard Component
 * 
 * Displays a single review with ratings, text, and user info
 */

import React from 'react';
import './ReviewCard.css';

const ReviewCard = ({ review, showAdminResponse = true }) => {
  const renderStars = (rating) => {
    const stars = [];
    const fullStars = Math.floor(rating);
    const hasHalfStar = rating % 1 >= 0.5;

    for (let i = 0; i < 5; i++) {
      if (i < fullStars) {
        stars.push(<span key={i} className="star filled">★</span>);
      } else if (i === fullStars && hasHalfStar) {
        stars.push(<span key={i} className="star half">★</span>);
      } else {
        stars.push(<span key={i} className="star empty">★</span>);
      }
    }
    return stars;
  };

  const formatDate = (dateString) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  };

  const ratingCategories = [
    { key: 'rating_service', label: 'Service Quality', icon: '📋' },
    { key: 'rating_staff', label: 'Staff', icon: '👥' },
    { key: 'rating_cleanliness', label: 'Cleanliness', icon: '🏥' },
    { key: 'rating_value', label: 'Value', icon: '💰' },
    { key: 'rating_communication', label: 'Communication', icon: '📞' },
    { key: 'rating_pet_condition', label: 'Pet Happiness', icon: '🐾' },
  ];

  return (
    <div className={`review-card ${review.is_featured ? 'featured' : ''}`}>
      {review.is_featured && (
        <div className="featured-badge">
          ⭐ Featured Review
        </div>
      )}

      <div className="review-header">
        <div className="reviewer-info">
          <div className="reviewer-avatar">
            {review.user?.profile_picture ? (
              <img src={review.user.profile_picture} alt={review.user.first_name} />
            ) : (
              <div className="avatar-placeholder">
                {review.user?.first_name?.[0]}{review.user?.last_name?.[0]}
              </div>
            )}
          </div>
          <div className="reviewer-details">
            <h4>{review.user?.first_name} {review.user?.last_name}</h4>
            <p className="review-date">{formatDate(review.created_at)}</p>
            {review.is_verified && (
              <span className="verified-badge">✓ Verified Customer</span>
            )}
          </div>
        </div>
        <div className="overall-rating">
          <div className="rating-number">{parseFloat(review.overall_rating).toFixed(1)}</div>
          <div className="rating-stars">
            {renderStars(parseFloat(review.overall_rating))}
          </div>
        </div>
      </div>

      <div className="review-service">
        <span className="service-tag">{review.service_type}</span>
        {review.pet && (
          <span className="pet-tag">🐾 {review.pet.name}</span>
        )}
      </div>

      <div className="review-text">
        <p>{review.review_text}</p>
      </div>

      {review.photos && (
        <div className="review-photo">
          <img src={review.photos} alt="Review" />
        </div>
      )}

      <div className="detailed-ratings">
        <h5>Detailed Ratings</h5>
        <div className="rating-grid">
          {ratingCategories.map(({ key, label, icon }) => (
            <div key={key} className="rating-item">
              <span className="rating-icon">{icon}</span>
              <span className="rating-label">{label}</span>
              <div className="rating-value">
                <div className="mini-stars">
                  {renderStars(review[key])}
                </div>
                <span className="rating-num">{review[key]}/5</span>
              </div>
            </div>
          ))}
        </div>
      </div>

      {showAdminResponse && review.admin_response && (
        <div className="admin-response">
          <div className="admin-response-header">
            <strong>Response from PawWell Care Center</strong>
            <span className="response-date">
              {formatDate(review.admin_response_date)}
            </span>
          </div>
          <p>{review.admin_response}</p>
        </div>
      )}

      {review.helpful_count > 0 && (
        <div className="helpful-count">
          👍 {review.helpful_count} {review.helpful_count === 1 ? 'person' : 'people'} found this helpful
        </div>
      )}
    </div>
  );
};

export default ReviewCard;

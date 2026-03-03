/**
 * ReviewForm Component
 * 
 * Form for users to submit reviews for completed bookings
 */

import React, { useState, useEffect } from 'react';
import { createReview, getReviewableBookings } from '../services/api';
import { toast } from 'react-toastify';
import './ReviewForm.css';

const ReviewForm = ({ onReviewSubmitted }) => {
  const [bookings, setBookings] = useState([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [selectedBooking, setSelectedBooking] = useState('');
  const [ratings, setRatings] = useState({
    rating_service: 5,
    rating_staff: 5,
    rating_cleanliness: 5,
    rating_value: 5,
    rating_communication: 5,
    rating_pet_condition: 5,
  });
  const [reviewText, setReviewText] = useState('');
  const [photo, setPhoto] = useState(null);
  const [photoPreview, setPhotoPreview] = useState(null);

  const ratingCategories = [
    { key: 'rating_service', label: 'Service Quality', icon: '📋' },
    { key: 'rating_staff', label: 'Staff Friendliness', icon: '👥' },
    { key: 'rating_cleanliness', label: 'Facility Cleanliness', icon: '🏥' },
    { key: 'rating_value', label: 'Value for Money', icon: '💰' },
    { key: 'rating_communication', label: 'Communication', icon: '📞' },
    { key: 'rating_pet_condition', label: 'Pet\'s Happiness', icon: '🐾' },
  ];

  useEffect(() => {
    fetchReviewableBookings();
  }, []);

  const fetchReviewableBookings = async () => {
    try {
      setLoading(true);
      const response = await getReviewableBookings();
      setBookings(response.data || []);
    } catch (error) {
      console.error('Error fetching bookings:', error);
      toast.error(error.message || 'Failed to load bookings');
    } finally {
      setLoading(false);
    }
  };

  const handleRatingChange = (category, value) => {
    setRatings(prev => ({ ...prev, [category]: value }));
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

    if (!selectedBooking) {
      toast.error('Please select a booking to review');
      return;
    }

    if (!reviewText.trim()) {
      toast.error('Please write a review');
      return;
    }

    try {
      setSubmitting(true);

      const formData = new FormData();
      formData.append('booking_id', selectedBooking);
      Object.keys(ratings).forEach(key => {
        formData.append(key, ratings[key]);
      });
      formData.append('review_text', reviewText.trim());
      if (photo) {
        formData.append('photo', photo);
      }

      const response = await createReview(formData);
      toast.success(response.message || 'Review submitted successfully!');

      // Reset form
      setSelectedBooking('');
      setRatings({
        rating_service: 5,
        rating_staff: 5,
        rating_cleanliness: 5,
        rating_value: 5,
        rating_communication: 5,
        rating_pet_condition: 5,
      });
      setReviewText('');
      setPhoto(null);
      setPhotoPreview(null);

      // Refresh bookings list
      await fetchReviewableBookings();

      // Callback
      if (onReviewSubmitted) {
        onReviewSubmitted();
      }
    } catch (error) {
      console.error('Error submitting review:', error);
      toast.error(error.message || 'Failed to submit review');
    } finally {
      setSubmitting(false);
    }
  };

  const renderStarRating = (category, currentRating) => {
    return (
      <div className="star-rating">
        {[1, 2, 3, 4, 5].map(star => (
          <button
            key={star}
            type="button"
            className={`star ${star <= currentRating ? 'filled' : ''}`}
            onClick={() => handleRatingChange(category, star)}
            aria-label={`Rate ${star} stars`}
          >
            ★
          </button>
        ))}
      </div>
    );
  };

  const calculateOverallRating = () => {
    const sum = Object.values(ratings).reduce((a, b) => a + b, 0);
    return (sum / 6).toFixed(1);
  };

  if (loading) {
    return <div className="review-form-loading">Loading bookings...</div>;
  }

  if (bookings.length === 0) {
    return (
      <div className="no-bookings">
        <h3>No Bookings to Review</h3>
        <p>Complete a booking first to leave a review!</p>
      </div>
    );
  }

  return (
    <form className="review-form" onSubmit={handleSubmit}>
      <h2>Leave a Review</h2>

      <div className="form-group">
        <label htmlFor="booking">Select Booking *</label>
        <select
          id="booking"
          value={selectedBooking}
          onChange={(e) => setSelectedBooking(e.target.value)}
          required
        >
          <option value="">-- Select a completed booking --</option>
          {bookings.map(booking => (
            <option key={booking.booking_id} value={booking.booking_id}>
              {booking.service_type} - {booking.pet?.name} (
              {new Date(booking.start_date).toLocaleDateString()})
            </option>
          ))}
        </select>
      </div>

      <div className="overall-rating-display">
        <h3>Overall Rating: {calculateOverallRating()} ⭐</h3>
      </div>

      <div className="rating-categories">
        <h3>Rate Your Experience</h3>
        {ratingCategories.map(({ key, label, icon }) => (
          <div key={key} className="rating-category">
            <div className="category-header">
              <span className="category-icon">{icon}</span>
              <span className="category-label">{label}</span>
              <span className="category-value">{ratings[key]}/5</span>
            </div>
            {renderStarRating(key, ratings[key])}
          </div>
        ))}
      </div>

      <div className="form-group">
        <label htmlFor="reviewText">Your Review *</label>
        <textarea
          id="reviewText"
          value={reviewText}
          onChange={(e) => setReviewText(e.target.value)}
          rows="5"
          placeholder="Tell us about your experience... (min 20 characters)"
          minLength={20}
          maxLength={500}
          required
        />
        <small>{reviewText.length}/500 characters</small>
      </div>

      <div className="form-group">
        <label htmlFor="photo">Upload Photo (Optional)</label>
        <input
          type="file"
          id="photo"
          accept="image/*"
          onChange={handlePhotoChange}
        />
        {photoPreview && (
          <div className="photo-preview">
            <img src={photoPreview} alt="Preview" />
            <button
              type="button"
              className="remove-photo"
              onClick={() => {
                setPhoto(null);
                setPhotoPreview(null);
              }}
            >
              Remove
            </button>
          </div>
        )}
      </div>

      <div className="form-actions">
        <button
          type="submit"
          className="submit-btn"
          disabled={submitting}
        >
          {submitting ? 'Submitting...' : 'Submit Review'}
        </button>
      </div>

      <p className="approval-note">
        <small>
          ℹ️ Your review will be visible after admin approval to ensure quality.
        </small>
      </p>
    </form>
  );
};

export default ReviewForm;

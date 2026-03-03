/**
 * ReviewList Component
 * 
 * Displays a paginated list of reviews with filtering options
 */

import React, { useState, useEffect } from 'react';
import { getReviews, getReviewStats } from '../services/api';
import ReviewCard from './ReviewCard';
import { toast } from 'react-toastify';
import './ReviewList.css';

const ReviewList = ({ featured = false, limit = 10, serviceType = '' }) => {
  const [reviews, setReviews] = useState([]);
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [filterServiceType, setFilterServiceType] = useState(serviceType);
  const [filterRating, setFilterRating] = useState('');

  const serviceTypes = [
    'All Services',
    'Grooming',
    'Boarding',
    'Daycare',
    'Veterinary',
    'Training',
    'Pet Sitting'
  ];

  useEffect(() => {
    fetchReviews();
  }, [currentPage, filterServiceType, filterRating, featured]);

  useEffect(() => {
    if (!featured) {
      fetchStats();
    }
  }, []);

  const fetchReviews = async () => {
    try {
      setLoading(true);
      const params = {
        page: currentPage,
        limit: limit,
      };

      if (featured) {
        params.featured = true;
      }

      if (filterServiceType && filterServiceType !== 'All Services') {
        params.service_type = filterServiceType;
      }

      if (filterRating) {
        params.min_rating = parseInt(filterRating);
      }

      const response = await getReviews(params);
      setReviews(response.data || []);
      setTotalPages(response.totalPages || 1);
    } catch (error) {
      console.error('Error fetching reviews:', error);
      toast.error(error.message || 'Failed to load reviews');
    } finally {
      setLoading(false);
    }
  };

  const fetchStats = async () => {
    try {
      const response = await getReviewStats();
      setStats(response.data);
    } catch (error) {
      console.error('Error fetching stats:', error);
    }
  };

  const handlePageChange = (newPage) => {
    setCurrentPage(newPage);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

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

  const renderPagination = () => {
    if (totalPages <= 1) return null;

    const pages = [];
    const maxVisiblePages = 5;
    let startPage = Math.max(1, currentPage - Math.floor(maxVisiblePages / 2));
    let endPage = Math.min(totalPages, startPage + maxVisiblePages - 1);

    if (endPage - startPage < maxVisiblePages - 1) {
      startPage = Math.max(1, endPage - maxVisiblePages + 1);
    }

    if (startPage > 1) {
      pages.push(
        <button key="first" onClick={() => handlePageChange(1)} className="page-btn">
          First
        </button>
      );
    }

    if (currentPage > 1) {
      pages.push(
        <button key="prev" onClick={() => handlePageChange(currentPage - 1)} className="page-btn">
          Previous
        </button>
      );
    }

    for (let i = startPage; i <= endPage; i++) {
      pages.push(
        <button
          key={i}
          onClick={() => handlePageChange(i)}
          className={`page-btn ${currentPage === i ? 'active' : ''}`}
        >
          {i}
        </button>
      );
    }

    if (currentPage < totalPages) {
      pages.push(
        <button key="next" onClick={() => handlePageChange(currentPage + 1)} className="page-btn">
          Next
        </button>
      );
    }

    if (endPage < totalPages) {
      pages.push(
        <button key="last" onClick={() => handlePageChange(totalPages)} className="page-btn">
          Last
        </button>
      );
    }

    return <div className="pagination">{pages}</div>;
  };

  return (
    <div className="review-list-container">
      {!featured && stats && (
        <div className="review-stats">
          <div className="stats-header">
            <h3>Customer Reviews</h3>
            <div className="overall-stats">
              <div className="overall-rating">
                <span className="rating-number">
                  {parseFloat(stats.averages?.avg_overall || 0).toFixed(1)}
                </span>
                <div className="stars">
                  {renderStars(parseFloat(stats.averages?.avg_overall || 0))}
                </div>
              </div>
              <p className="total-reviews">
                Based on {stats.averages?.total_reviews || 0} reviews
              </p>
            </div>
          </div>

          <div className="category-stats">
            <div className="stat-item">
              <span className="stat-icon">📋</span>
              <span className="stat-label">Service Quality</span>
              <span className="stat-value">
                {parseFloat(stats.averages?.avg_service || 0).toFixed(1)} ⭐
              </span>
            </div>
            <div className="stat-item">
              <span className="stat-icon">👥</span>
              <span className="stat-label">Staff Friendliness</span>
              <span className="stat-value">
                {parseFloat(stats.averages?.avg_staff || 0).toFixed(1)} ⭐
              </span>
            </div>
            <div className="stat-item">
              <span className="stat-icon">🏥</span>
              <span className="stat-label">Cleanliness</span>
              <span className="stat-value">
                {parseFloat(stats.averages?.avg_cleanliness || 0).toFixed(1)} ⭐
              </span>
            </div>
            <div className="stat-item">
              <span className="stat-icon">💰</span>
              <span className="stat-label">Value for Money</span>
              <span className="stat-value">
                {parseFloat(stats.averages?.avg_value || 0).toFixed(1)} ⭐
              </span>
            </div>
            <div className="stat-item">
              <span className="stat-icon">📞</span>
              <span className="stat-label">Communication</span>
              <span className="stat-value">
                {parseFloat(stats.averages?.avg_communication || 0).toFixed(1)} ⭐
              </span>
            </div>
            <div className="stat-item">
              <span className="stat-icon">🐾</span>
              <span className="stat-label">Pet Happiness</span>
              <span className="stat-value">
                {parseFloat(stats.averages?.avg_pet_condition || 0).toFixed(1)} ⭐
              </span>
            </div>
          </div>
        </div>
      )}

      {!featured && (
        <div className="review-filters">
          <div className="filter-group">
            <label htmlFor="serviceTypeFilter">Service Type:</label>
            <select
              id="serviceTypeFilter"
              value={filterServiceType}
              onChange={(e) => {
                setFilterServiceType(e.target.value);
                setCurrentPage(1);
              }}
            >
              {serviceTypes.map(type => (
                <option key={type} value={type}>{type}</option>
              ))}
            </select>
          </div>

          <div className="filter-group">
            <label htmlFor="ratingFilter">Minimum Rating:</label>
            <select
              id="ratingFilter"
              value={filterRating}
              onChange={(e) => {
                setFilterRating(e.target.value);
                setCurrentPage(1);
              }}
            >
              <option value="">All Ratings</option>
              <option value="5">5 Stars</option>
              <option value="4">4+ Stars</option>
              <option value="3">3+ Stars</option>
              <option value="2">2+ Stars</option>
              <option value="1">1+ Stars</option>
            </select>
          </div>
        </div>
      )}

      <div className="reviews-list">
        {loading ? (
          <div className="loading">Loading reviews...</div>
        ) : reviews.length === 0 ? (
          <div className="no-reviews">
            <h3>No reviews yet</h3>
            <p>Be the first to share your experience!</p>
          </div>
        ) : (
          reviews.map(review => (
            <ReviewCard key={review.review_id} review={review} />
          ))
        )}
      </div>

      {!loading && reviews.length > 0 && renderPagination()}
    </div>
  );
};

export default ReviewList;

/**
 * ReviewsPage
 * 
 * Dedicated page to display all customer reviews with filters and pagination
 */

import React from 'react';
import { Link } from 'react-router-dom';
import ReviewList from '../components/ReviewList';
import './ReviewsPage.css';

const ReviewsPage = () => {
  return (
    <div className="reviews-page">
      {/* Page Header */}
      <section className="reviews-page-header">
        <div className="reviews-header-content">
          <div className="breadcrumb">
            <Link to="/">Home</Link>
            <span className="separator">/</span>
            <span className="current">Customer Reviews</span>
          </div>
          
          <h1>Customer Reviews</h1>
          <p className="header-subtitle">
            See what pet parents say about their experience with PawWell Care Center
          </p>
          
          <div className="trust-badges">
            <div className="badge">
              <span className="badge-icon">⭐</span>
              <div className="badge-text">
                <strong>Trusted Care</strong>
                <small>500+ Happy Pets</small>
              </div>
            </div>
            <div className="badge">
              <span className="badge-icon">✓</span>
              <div className="badge-text">
                <strong>Verified Reviews</strong>
                <small>Real Customer Feedback</small>
              </div>
            </div>
            <div className="badge">
              <span className="badge-icon">🏆</span>
              <div className="badge-text">
                <strong>Top Rated</strong>
                <small>4.8/5 Average Rating</small>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Reviews List Section */}
      <section className="reviews-list-section">
        <ReviewList limit={12} />
      </section>

      {/* CTA Section */}
      <section className="reviews-cta">
        <div className="cta-content">
          <h2>Ready to Experience PawWell Care?</h2>
          <p>Join hundreds of satisfied pet parents who trust us with their furry friends</p>
          <div className="cta-buttons">
            <Link to="/signup" className="btn-primary-cta">Get Started</Link>
            <Link to="/about" className="btn-secondary-cta">Learn More</Link>
          </div>
        </div>
      </section>
    </div>
  );
};

export default ReviewsPage;

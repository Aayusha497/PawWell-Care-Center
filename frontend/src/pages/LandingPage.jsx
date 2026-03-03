/**
 * Landing Page
 * 
 * Main homepage with hero and services sections
 */

import React from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import ReviewList from '../components/ReviewList';

const LandingPage = () => {
  const { isAuthenticated } = useAuth();

  const petTypes = [
    { icon: '🐕', name: 'Dogs' },
    { icon: '🐈', name: 'Cats' },
    { icon: '🐦', name: 'Birds' },
    { icon: '🐢', name: 'Reptiles' },
    { icon: '🐹', name: 'Small Pets' },
  ];

  const services = [
    {
      title: 'Boarding',
      description: 'We can take any pet for the short or long term',
      color: '#A8D14F',
      icon: '🏠'
    },
    {
      title: 'Veterinary',
      description: 'Professional veterinary care',
      color: '#87CEEB',
      icon: '⚕️'
    },
    {
      title: 'Live video',
      description: 'You can watch your pet 24/7',
      color: '#FA9884',
      icon: '📹'
    },
    {
      title: 'Training',
      description: 'Experienced coaches will adjust behavior',
      color: '#B19CD9',
      icon: '🎓'
    },
    {
      title: 'Grooming',
      description: 'Your pet will look like it\'s ready for the show',
      color: '#7FD8BE',
      icon: '✂️'
    },
  ];

  return (
    <div className="landing-page">
      {/* Hero Section */}
      <section className="hero-section">
        <div className="hero-container">
          <div className="hero-left">
            <div className="hero-logo">
              <span className="paw-icon">🐾</span>
              <span className="logo-text">PawWell</span>
            </div>
            
            <h1 className="hero-title">
              Loving sitters take<br />care of your pet
            </h1>
            
            <p className="hero-description">
              Our facility provides professional care-giving in a clean, safe and home-like environment for your pet!
            </p>

            <div className="pet-care-section">
              <p className="pet-care-label">We can take care of your:</p>
              <div className="pet-types">
                {petTypes.map((pet, index) => (
                  <div key={index} className="pet-type-icon" title={pet.name}>
                    {pet.icon}
                  </div>
                ))}
                <div className="pet-type-icon more">▶</div>
              </div>
            </div>

            <div className="search-section">
              <button className="search-btn drop-off">Drop off</button>
              <button className="search-btn pick-up">Pick up</button>
              <button className="search-btn-primary">Search</button>
            </div>
          </div>

          <div className="hero-right">
            <div className="hero-image-container">
              <div className="hero-pet-image">
                🐕
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Services Section */}
      <section className="services-section">
        <div className="services-grid">
          {services.map((service, index) => (
            <div key={index} className="service-card-landing" style={{ backgroundColor: service.color }}>
              <div className="service-icon-landing">{service.icon}</div>
              <h3 className="service-title-landing">{service.title}</h3>
              <p className="service-desc-landing">{service.description}</p>
              {index === 1 && <button className="service-arrow">▶</button>}
            </div>
          ))}
        </div>
      </section>

      {/* Featured Reviews Section */}
      <section className="reviews-section">
        <div className="reviews-container">
          <div className="reviews-header">
            <h2>What Our Customers Say</h2>
            <p>Real experiences from pet parents who trust PawWell</p>
          </div>
          <ReviewList featured={true} limit={3} />
          <div className="reviews-footer">
            <Link to="/about" className="btn-see-all-reviews">See All Reviews</Link>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="cta-section">
        <div className="cta-container">
          <h2>Ready to Give Your Pet the Best Care?</h2>
          <p>Join thousands of happy pet owners who trust PawWell</p>
          <div className="cta-buttons">
            {!isAuthenticated && (
              <>
                <Link to="/signup" className="btn-cta-primary">Sign Up Now</Link>
                <Link to="/login" className="btn-cta-secondary">Login</Link>
              </>
            )}
            {isAuthenticated && (
              <Link to="/dashboard" className="btn-cta-primary">Go to Dashboard</Link>
            )}
          </div>
        </div>
      </section>
    </div>
  );
};

export default LandingPage;

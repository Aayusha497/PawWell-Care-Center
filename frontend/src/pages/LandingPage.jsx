/**
 * Landing Page
 * Comprehensive pet care landing page showing services, how it works, reviews, and more
 */

import React, { useState, useEffect, useMemo } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import ReviewList from '../components/ReviewList';
import { getReviews } from '../services/api';
import './theme.css';

const LandingPage = () => {
  const { isLoggedIn } = useAuth();
  const navigate = useNavigate();
  const [reviewStats, setReviewStats] = useState({
    avgRating: 0,
    totalReviews: 0
  });

  const petTypes = [
    { icon: '🐕', name: 'Dogs' },
    { icon: '🐈', name: 'Cats' },
    { icon: '🐦', name: 'Birds' },
    { icon: '🐢', name: 'Reptiles' },
    { icon: '🐹', name: 'Small Pets' },
  ];

  // Updated services: Boarding, Day Care, Walking, Emergency
  const services = [
    {
      title: 'Boarding',
      description: 'Safe, comfortable accommodation for your pet',
      color: '#A8D14F',
      icon: '🏠'
    },
    {
      title: 'Day Care',
      description: 'Playful supervision and care during the day',
      color: '#87CEEB',
      icon: '🎾'
    },
    {
      title: 'Walking',
      description: 'Regular exercise and outdoor exploration',
      color: '#FA9884',
      icon: '🚶'
    },
    {
      title: 'Emergency',
      description: '24/7 urgent pet care support',
      color: '#B19CD9',
      icon: '🆘'
    }
  ];

  // Updated "How PawWell Works" - 5 steps
  const howItWorks = [
    {
      step: '01',
      title: 'Create Account',
      description: 'Sign up with your email and basic information.',
      icon: '📝'
    },
    {
      step: '02',
      title: 'Add Pet Profile',
      description: 'Enter pet details, medical info, and special needs.',
      icon: '🐾'
    },
    {
      step: '03',
      title: 'Book Service',
      description: 'Choose service type, dates, and caretaker preference.',
      icon: '📅'
    },
    {
      step: '04',
      title: 'Admin Approval',
      description: 'We verify your details for safety and security.',
      icon: '✅'
    },
    {
      step: '05',
      title: 'Payment & Care',
      description: 'Complete payment and drop off your pet with confidence.',
      icon: '💳'
    }
  ];

  const whyPawwellItems = useMemo(() => ([
    {
      icon: '🔒',
      title: 'Safe & Trusted Care',
      description: 'All caretakers are verified and trained professionals with strict background checks.'
    },
    {
      icon: '📸',
      title: 'Real-time Updates',
      description: 'Get daily photos and activity logs showing exactly how your pet spent their day.'
    },
    {
      icon: '📱',
      title: 'Easy Booking',
      description: 'Book services in minutes with an intuitive app and flexible scheduling options.'
    },
    {
      icon: '🚨',
      title: 'Emergency Support',
      description: '24/7 emergency team ready to help with any urgent pet care needs.'
    }
  ]), []);

  const emergencyFeatures = [
    {
      icon: '☎️',
      title: 'Call Now',
      description: 'Speak with our emergency team instantly',
      action: 'call',
      link: 'tel:+977-1-XXXXXXX'
    },
    {
      icon: '💬',
      title: 'Chat on WhatsApp',
      description: 'Quick messaging for urgent pet care needs',
      action: 'whatsapp',
      link: 'https://wa.me/977XXXXXXXXX'
    }
  ];

  const faqs = [
    {
      question: 'Is my pet safe with PawWell?',
      answer: 'Yes! All our caretakers undergo thorough background checks and professional training. We have 24/7 monitoring, and pet health records are securely stored. Your pet\'s safety is our top priority.'
    },
    {
      question: 'How does booking work?',
      answer: 'Create your account, add your pet profile with medical info, select a service and dates, get admin approval, complete payment, and drop off your pet. It\'s that simple!'
    },
    {
      question: 'Can I cancel my booking?',
      answer: 'Yes. Cancellations made 7+ days before get a full refund. 3-7 days gets 50% refund. Less than 3 days is non-refundable. Contact us for any issues.'
    },
    {
      question: 'What happens in an emergency?',
      answer: 'We have a 24/7 emergency hotline and WhatsApp support. Our team coordinates with trusted vets immediately. You\'ll be contacted right away if any urgent situation arises.'
    }
  ];

  // Fetch review statistics on component mount
  useEffect(() => {
    const fetchReviewStats = async () => {
      try {
        const response = await getReviews({ limit: 1 });
        if (response.success && response.data) {
          const avgRating = response.data.length > 0 
            ? (response.data.reduce((sum, r) => sum + parseFloat(r.overall_rating || 0), 0) / response.data.length).toFixed(1)
            : 0;
          setReviewStats({
            avgRating: parseFloat(avgRating) || 0,
            totalReviews: response.count || 0
          });
        }
      } catch (error) {
        console.error('Error fetching review stats:', error);
      }
    };
    fetchReviewStats();
  }, []);

  const handleBookNow = () => {
    if (isLoggedIn) {
      navigate('/booking');
    } else {
      navigate('/signup', { state: { from: '/booking' } });
    }
  };

  const handleAboutContact = () => {
    const element = document.getElementById('contact-section');
    if (element) {
      element.scrollIntoView({ behavior: 'smooth' });
    }
  };

  return (
    <div className="landing-page">
      {/* ===== HERO SECTION ===== */}
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

            <div className="hero-cta-buttons">
              <button className="btn-hero-book" onClick={handleBookNow}>
                Book Now
              </button>
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

      {/* ===== OUR SERVICES SECTION ===== */}
      <section className="services-section">
        <div className="section-header">
          <h2>Our Services</h2>
          <p>Professional pet care services tailored to your needs</p>
        </div>
        <div className="services-grid">
          {services.map((service, index) => (
            <div key={index} className="service-card-landing" style={{ backgroundColor: service.color }}>
              <div className="service-icon-landing">{service.icon}</div>
              <h3 className="service-title-landing">{service.title}</h3>
              <p className="service-desc-landing">{service.description}</p>
            </div>
          ))}
        </div>
      </section>

      {/* ===== HOW PAWWELL WORKS SECTION ===== */}
      <section className="how-it-works-section">
        <div className="section-header">
          <h2>How PawWell Works</h2>
          <p>From sign-up to daily updates in three simple steps</p>
        </div>
        <div className="steps-grid">
          {howItWorks.map((item, index) => (
            <div key={index} className="step-card">
              <span className="step-number">{item.step}</span>
              <div className="step-icon">{item.icon}</div>
              <h3>{item.title}</h3>
              <p>{item.description}</p>
            </div>
          ))}
        </div>
      </section>

      {/* ===== RATINGS & REVIEWS SECTION ===== */}
      <section className="ratings-section">
        <div className="section-header">
          <h2>What Our Customers Say</h2>
          <p>Real experiences from pet parents who trust PawWell</p>
        </div>
        
        {/* Review Stats */}
        <div className="reviews-stats">
          <div className="stat-card">
            <div className="stat-number">
              <span className="star">⭐</span>
              {reviewStats.avgRating}
            </div>
            <div className="stat-label">Average Rating</div>
          </div>
          <div className="stat-card">
            <div className="stat-number">{reviewStats.totalReviews}+</div>
            <div className="stat-label">Happy Pet Parents</div>
          </div>
        </div>

        {/* Top 3 Reviews */}
        <ReviewList featured={true} limit={3} />
        
        {/* View All Reviews Button */}
        <div className="ratings-footer">
          <Link to="/reviews" className="btn-see-all-reviews">View All Reviews</Link>
        </div>
      </section>

      {/* ===== WHY PAWWELL SECTION ===== */}
      <section className="why-pawwell-section">
        <div className="section-header">
          <h2>Why Choose PawWell?</h2>
          <p>Transparent, secure, and compassionate pet care</p>
        </div>
        <div className="why-grid">
          {whyPawwellItems.map((item, index) => (
            <div key={index} className="why-card">
              <div className="why-icon">{item.icon}</div>
              <h3>{item.title}</h3>
              <p>{item.description}</p>
            </div>
          ))}
        </div>
      </section>

      {/* ===== GALLERY SECTION ===== */}
      <section className="gallery-section">
        <div className="section-header">
          <h2>Gallery</h2>
          <p>Moments captured during pet care sessions (Admin-managed)</p>
        </div>
        <div className="gallery-container">
          <div className="gallery-grid">
            <div className="gallery-item placeholder">
              <span>📸</span>
              <p>Happy pets in action</p>
            </div>
            <div className="gallery-item placeholder">
              <span>🎾</span>
              <p>Fun playtime moments</p>
            </div>
            <div className="gallery-item placeholder">
              <span>😴</span>
              <p>Cozy rest time</p>
            </div>
            <div className="gallery-item placeholder">
              <span>🍽️</span>
              <p>Meal time</p>
            </div>
            <div className="gallery-item placeholder">
              <span>🛁</span>
              <p>Grooming services</p>
            </div>
            <div className="gallery-item placeholder">
              <span>🏃</span>
              <p>Active playtime</p>
            </div>
          </div>
          <p className="gallery-note">Gallery managed by admin team. Images uploaded after each service session.</p>
        </div>
      </section>

      {/* ===== BOOKING CTA SECTION ===== */}
      <section className="booking-cta-section">
        <div className="booking-cta-content">
          <div className="section-header">
            <h2>Book Trusted Pet Care Today</h2>
            <p>Get your pet the best care in just a few clicks</p>
          </div>
          <button className="btn-cta-book-now" onClick={handleBookNow}>
            Book Now
          </button>
        </div>
      </section>

      {/* ===== EMERGENCY FEATURE SECTION ===== */}
      <section className="emergency-section">
        <div className="section-header">
          <h2>Emergency Support Available 24/7</h2>
          <p>Need urgent help for your pet? Contact us instantly.</p>
        </div>
        <div className="emergency-buttons">
          {emergencyFeatures.map((feature, index) => (
            <a
              key={index}
              href={feature.link}
              target={feature.action === 'whatsapp' ? '_blank' : undefined}
              rel={feature.action === 'whatsapp' ? 'noopener noreferrer' : undefined}
              className="btn-emergency"
            >
              <span className="emergency-btn-icon">{feature.icon}</span>
              <div className="emergency-btn-text">
                <h3>{feature.title}</h3>
                <p>{feature.description}</p>
              </div>
            </a>
          ))}
        </div>
      </section>

      {/* ===== ABOUT US SECTION ===== */}
      <section className="about-section">
        <div className="about-container">
          <div className="about-content">
            <h2>About PawWell Care Center</h2>
            <p>
              PawWell is dedicated to providing safe, transparent, and compassionate pet care. 
              We connect pet owners with verified caretakers and provide structured care with daily activity updates.
            </p>
            <p>
              Our mission is to deliver trusted pet care with technology that builds lasting relationships between pet owners and caretakers.
            </p>
            <div className="about-buttons">
              <Link to="/about" className="btn-learn-more">Learn More About Us</Link>
            </div>
          </div>
        </div>
      </section>

      {/* ===== FAQ SECTION ===== */}
      <section className="faq-section">
        <div className="section-header">
          <h2>Frequently Asked Questions</h2>
          <p>Find answers to common questions about PawWell</p>
        </div>
        <div className="faq-container">
          {faqs.map((faq, index) => (
            <details key={index} className="faq-item">
              <summary className="faq-question">{faq.question}</summary>
              <p className="faq-answer">{faq.answer}</p>
            </details>
          ))}
        </div>
      </section>

      {/* ===== CTA SECTION ===== */}
      <section className="final-cta-section">
        <div className="cta-container">
          <h2>Ready to Give Your Pet the Best Care?</h2>
          <p>Join thousands of happy pet owners who trust PawWell</p>
          <div className="cta-buttons">
            {!isLoggedIn && (
              <>
                <Link to="/signup" className="btn-cta-primary">Sign Up Now</Link>
                <Link to="/login" className="btn-cta-secondary">Login</Link>
              </>
            )}
            {isLoggedIn && (
              <Link to="/dashboard" className="btn-cta-primary">Go to Dashboard</Link>
            )}
          </div>
        </div>
      </section>
    </div>
  );
};

export default LandingPage;

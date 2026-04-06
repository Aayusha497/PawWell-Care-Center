/**
 * Emergency Page
 * Protected route for authenticated users to request emergency support
 */

import React from 'react';
import Footer from '../components/Footer';
import './About.css';

const Emergency = () => {
  const emergencyServices = [
    {
      icon: '☎️',
      title: 'Call Now',
      description: 'Speak with our emergency team instantly',
      link: 'tel:+977-9703712593'
    },
    {
      icon: '💬',
      title: 'Chat on WhatsApp',
      description: 'Quick messaging for urgent pet care needs',
      link: 'https://wa.me/977XXXXXXXXX'
    }
  ];

  return (
    <div className="about-page">
        <section className="about-hero">
          <div className="about-hero-content">
            <p className="about-pill">Emergency Support</p>
            <h1>24/7 Emergency Support Available</h1>
            <p className="about-hero-subtitle">
              Our emergency team is always ready to help your pet in urgent situations.
            </p>
            <div className="about-hero-actions">
              <button 
                className="btn-primary" 
                onClick={() => navigate('/about')}
              >
                Back to Aboutwindow.location.href = '/about'
              </button>
            </div>
          </div>
        </section>

        <section className="about-contact">
          <div className="contact-info">
            <h2>Emergency Contacts</h2>
            <p>Contact us immediately if your pet needs urgent care.</p>
            <div className="contact-details">
              <p>📞 +977-9703712593</p>
              <p>📍 Kamalpokhari, City Center, Kathmandu, Nepal</p>
              <p>⏱️ Available 24/7</p>
            </div>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))', gap: '24px', marginTop: '40px' }}>
            {emergencyServices.map((service, index) => (
              <a
                key={index}
                href={service.link}
                target={service.title === 'Chat on WhatsApp' ? '_blank' : undefined}
                rel={service.title === 'Chat on WhatsApp' ? 'noopener noreferrer' : undefined}
                style={{
                  padding: '24px',
                  backgroundColor: '#FF6B6B',
                  color: '#fff',
                  borderRadius: '8px',
                  textAlign: 'center',
                  textDecoration: 'none',
                  transition: 'background-color 0.3s',
                  cursor: 'pointer'
                }}
                onMouseOver={(e) => e.currentTarget.style.backgroundColor = '#FF5252'}
                onMouseOut={(e) => e.currentTarget.style.backgroundColor = '#FF6B6B'}
              >
                <div style={{ fontSize: '2rem', marginBottom: '12px' }}>{service.icon}</div>
                <h3 style={{ fontSize: '1.2rem', marginBottom: '8px' }}>{service.title}</h3>
                <p>{service.description}</p>
              </a>
            ))}
          </div>
        </section>
        <Footer />
      </div>
    );
  }

export default Emergency;

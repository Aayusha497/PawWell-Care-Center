/**
 * Footer Component
 * 
 * Footer with contact information, quick links, and social media
 */

import React from 'react';
import { Link } from 'react-router-dom';

const Footer = () => {
  const currentYear = new Date().getFullYear();

  return (
    <footer className="footer">
      <div className="footer-container">
        <div className="footer-grid">
          {/* About Column */}
          <div className="footer-column">
            <h3 className="footer-title">🐾 PawWell Care Center</h3>
            <p className="footer-description">
              Premium pet care services with love and professionalism. 
              Taking care of your pets, one paw at a time.
            </p>
          </div>

          {/* Quick Links Column */}
          <div className="footer-column">
            <h4 className="footer-heading">Quick Links</h4>
            <ul className="footer-links">
              <li>
                <Link to="/">Home</Link>
              </li>
              <li>
                <a href="/#about">About Us</a>
              </li>
              <li>
                <a href="/#services">Services</a>
              </li>
              <li>
                <Link to="/signup">Get Started</Link>
              </li>
            </ul>
          </div>

          {/* Services Column */}
          <div className="footer-column">
            <h4 className="footer-heading">Services</h4>
            <ul className="footer-links">
              <li>Pet Boarding</li>
              <li>Daycare</li>
              <li>Grooming</li>
              <li>Veterinary Care</li>
              <li>Training</li>
              <li>Nutrition Consulting</li>
            </ul>
          </div>

          {/* Contact Column */}
          <div className="footer-column">
            <h4 className="footer-heading">Contact Us</h4>
            <ul className="footer-contact">
              <li>
                <span>📍</span> 123 Pet Care Street, City, State 12345
              </li>
              <li>
                <span>📞</span> +1 (555) 123-4567
              </li>
              <li>
                <span>✉️</span> info@pawwellcare.com
              </li>
              <li>
                <span>🕒</span> Mon-Fri: 8AM-8PM, Sat-Sun: 9AM-6PM
              </li>
            </ul>
          </div>
        </div>

        {/* Social Media */}
        <div className="footer-social">
          <h4>Follow Us</h4>
          <div className="social-icons">
            <a href="https://facebook.com" aria-label="Facebook" className="social-icon" target="_blank" rel="noopener noreferrer">
              Facebook
            </a>
            <a href="https://twitter.com" aria-label="Twitter" className="social-icon" target="_blank" rel="noopener noreferrer">
              Twitter
            </a>
            <a href="https://instagram.com" aria-label="Instagram" className="social-icon" target="_blank" rel="noopener noreferrer">
              Instagram
            </a>
            <a href="https://linkedin.com" aria-label="LinkedIn" className="social-icon" target="_blank" rel="noopener noreferrer">
              LinkedIn
            </a>
          </div>
        </div>

        {/* Bottom Bar */}
        <div className="footer-bottom">
          <p>
            &copy; {currentYear} PawWell Care Center. All rights reserved.
          </p>
          <div className="footer-legal">
            <Link to="/privacy">Privacy Policy</Link>
            <span>|</span>
            <Link to="/terms">Terms of Service</Link>
          </div>
        </div>
      </div>
    </footer>
  );
};

export default Footer;

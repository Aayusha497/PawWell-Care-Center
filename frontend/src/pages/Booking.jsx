import React from 'react';
import { Link } from 'react-router-dom';
import './Booking.css';

const Booking = () => {
  return (
    <div className="booking-page">
      <div className="booking-card">
        <p className="booking-pill">Bookings</p>
        <h1>Booking requests are coming soon</h1>
        <p className="booking-subtitle">
          We are finalizing scheduling, caretaker availability, and notification flows.
        </p>
        <div className="booking-actions">
          <Link to="/dashboard" className="btn-primary">Back to Dashboard</Link>
          <Link to="/about#contact" className="btn-secondary">Contact PawWell</Link>
        </div>
      </div>
    </div>
  );
};

export default Booking;

/**
 * Booking Card Component
 * 
 * Displays booking information in card format
 */

import React from 'react';

const BookingCard = ({ booking }) => {
  const formatDate = (dateString) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', { 
      month: 'short', 
      day: 'numeric', 
      year: 'numeric' 
    });
  };

  const getStatusClass = (status) => {
    switch (status?.toLowerCase()) {
      case 'confirmed':
        return 'status-confirmed';
      case 'pending':
        return 'status-pending';
      case 'completed':
        return 'status-completed';
      case 'cancelled':
        return 'status-cancelled';
      default:
        return 'status-pending';
    }
  };

  const getStatusLabel = (status) => {
    if (!status) return 'Upcomming';
    return status.charAt(0).toUpperCase() + status.slice(1);
  };

  return (
    <div className="booking-card">
      <div className="booking-card-content">
        <div className="booking-card-info">
          <h4 className="booking-service-type">{booking.service_type}</h4>
          <p className="booking-pet-name">{booking.pet?.name || 'Pet'}</p>
          <p className="booking-date">{formatDate(booking.date)}</p>
        </div>
        <div className={`booking-status ${getStatusClass(booking.status)}`}>
          {getStatusLabel(booking.status)}
        </div>
      </div>
    </div>
  );
};

export default BookingCard;

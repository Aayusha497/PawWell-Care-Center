/**
 * Activity Card Component
 * 
 * Displays activity log information
 */

import React from 'react';

const ActivityCard = ({ activity }) => {
  const getTimeAgo = (timestamp) => {
    const now = new Date();
    const activityDate = new Date(timestamp);
    const diffInMs = now - activityDate;
    const diffInMinutes = Math.floor(diffInMs / 60000);
    const diffInHours = Math.floor(diffInMinutes / 60);
    const diffInDays = Math.floor(diffInHours / 24);

    if (diffInMinutes < 1) {
      return 'Just now';
    } else if (diffInMinutes < 60) {
      return `${diffInMinutes} ${diffInMinutes === 1 ? 'minute' : 'minutes'} ago`;
    } else if (diffInHours < 24) {
      return `${diffInHours} ${diffInHours === 1 ? 'hour' : 'hours'} ago`;
    } else if (diffInDays < 7) {
      return `${diffInDays} ${diffInDays === 1 ? 'day' : 'days'} ago`;
    } else {
      return activityDate.toLocaleDateString('en-US', { 
        month: 'short', 
        day: 'numeric',
        year: 'numeric'
      });
    }
  };

  return (
    <div className="activity-card">
      <div className="activity-content">
        <p className="activity-detail">{activity.detail || activity.activity_type}</p>
        <p className="activity-time">{getTimeAgo(activity.timestamp)}</p>
      </div>
    </div>
  );
};

export default ActivityCard;

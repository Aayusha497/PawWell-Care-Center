/**
 * Dashboard Card Component
 * 
 * Reusable card component for dashboard sections
 */

import React from 'react';

const DashboardCard = ({ 
  title, 
  children, 
  className = '', 
  headerAction = null,
  noPadding = false 
}) => {
  return (
    <div className={`dashboard-card ${className}`}>
      {title && (
        <div className="dashboard-card-header">
          <h3 className="dashboard-card-title">{title}</h3>
          {headerAction && (
            <div className="dashboard-card-action">
              {headerAction}
            </div>
          )}
        </div>
      )}
      <div className={`dashboard-card-content ${noPadding ? 'no-padding' : ''}`}>
        {children}
      </div>
    </div>
  );
};

export default DashboardCard;

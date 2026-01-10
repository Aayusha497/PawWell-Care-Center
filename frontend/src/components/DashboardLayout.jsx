/**
 * Dashboard Layout Component
 * 
 * Provides consistent layout wrapper for dashboard pages
 * Note: Navbar and Footer are already rendered in App.jsx
 */

import React from 'react';

const DashboardLayout = ({ children }) => {
  return (
    <div className="dashboard-layout">
      <main className="dashboard-main">
        {children}
      </main>
    </div>
  );
};

export default DashboardLayout;

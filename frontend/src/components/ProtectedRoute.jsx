/**
 * Protected Route Component
 * 
 * Wraps routes that require authentication and optional role-based authorization.
 * Redirects to login if user is not authenticated.
 * Shows permission denied if user lacks required role.
 */

import React from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { hasRole, isAdmin } from '../utils/rbac';
import PermissionDenied from './PermissionDenied';

/**
 * ProtectedRoute Component
 * 
 * @param {React.ReactNode} children - Child components to render
 * @param {string|string[]} requiredRoles - Required role(s) to access route
 * @param {string} redirectTo - Where to redirect if unauthorized (default: appropriate dashboard)
 * @param {boolean} requireAuth - Whether authentication is required (default: true)
 */
const ProtectedRoute = ({ 
  children, 
  requiredRoles = null,
  redirectTo = null,
  requireAuth = true 
}) => {
  const { user, isAuthenticated, loading } = useAuth();
  const location = useLocation();

  // Show loading state
  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#EAB308] mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading...</p>
        </div>
      </div>
    );
  }

  // Check authentication
  if (requireAuth && !isAuthenticated) {
    // Redirect to login, but save the location they were trying to access
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  // Check role-based authorization
  if (requiredRoles && user) {
    if (!hasRole(user.userType, requiredRoles)) {
      // Determine appropriate redirect
      let defaultRedirect = '/';
      if (isAdmin(user)) {
        defaultRedirect = '/admin/dashboard';
      } else if (user.userType === 'pet_owner') {
        defaultRedirect = '/dashboard';
      }

      // If redirectTo is specified, redirect there
      if (redirectTo) {
        return <Navigate to={redirectTo} replace />;
      }

      // Otherwise show permission denied page
      const roleNames = Array.isArray(requiredRoles) ? requiredRoles.join(' or ') : requiredRoles;
      return (
        <PermissionDenied 
          message={`This page requires ${roleNames} role. You are logged in as ${user.userType}.`}
          redirectTo={defaultRedirect}
          redirectLabel="Go to Dashboard"
        />
      );
    }
  }

  // User is authenticated and authorized
  return children;
};

export default ProtectedRoute;

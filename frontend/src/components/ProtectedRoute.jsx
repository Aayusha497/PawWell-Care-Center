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
  const { user, isLoggedIn, loading } = useAuth();
  const location = useLocation();

  // Debugging logs
  console.log('ProtectedRoute Debug:', {
    path: location.pathname,
    isLoggedIn,
    userEmail: user?.email,
    isProfileComplete: user?.isProfileComplete,
    loading
  });

  // Show loading state while auth is initializing
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

  // 1. Check Authentication
  if (requireAuth && !isLoggedIn) {
    // Redirect to login, but save the location they were trying to access
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  // 2. Check Profile Completion
  // Redirect to profile setup if user is logged in but profile is incomplete.
  // We skip this check if the user is already on the profile setup page or logging out.
  // Robust check for falsy values on isProfileComplete
  if (requireAuth && isLoggedIn && user && !user.isProfileComplete) {
    // Handle trailing slashes in pathname check
    const currentPath = location.pathname.replace(/\/$/, '');
    const isProfileSetup = currentPath === '/profile-setup';
    const isLogout = location.pathname.includes('/logout');

    if (!isProfileSetup && !isLogout) {
      console.log('Redirecting to /profile-setup because profile is incomplete');
      return <Navigate to="/profile-setup" replace />;
    }
  }

  // 3. Check Role-based Authorization
  if (requiredRoles && user) {
    if (!hasRole(user.userType || user.role, requiredRoles)) {
      // Determine appropriate redirect
      let defaultRedirect = '/';
      if (isAdmin(user)) {
        defaultRedirect = '/admin/dashboard';
      } else if (user.userType === 'pet_owner') {
        defaultRedirect = '/dashboard';
      }

      // If redirectTo is specified, redirect there immediately
      if (redirectTo) {
        return <Navigate to={redirectTo} replace />;
      }

      // Otherwise show permission denied page
      const roleNames = Array.isArray(requiredRoles) ? requiredRoles.join(' or ') : requiredRoles;
      return (
        <PermissionDenied 
          message={`This page requires ${roleNames} role. You are logged in as ${user.userType || user.role}.`}
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

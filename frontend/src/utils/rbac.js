/**
 * Role-Based Access Control (RBAC) Utilities - Frontend
 * 
 * Defines roles and provides helper functions for frontend authorization
 */

/**
 * System Roles
 * Must match backend roles exactly
 */
export const ROLES = {
  ADMIN: 'admin',
  PET_OWNER: 'pet_owner',
  USER: 'pet_owner' // Alias for clarity
};

/**
 * Check if a user has the required role
 * @param {string} userRole - The user's role
 * @param {string|string[]} requiredRoles - Required role(s)
 * @returns {boolean} - True if user has required role
 */
export const hasRole = (userRole, requiredRoles) => {
  if (!userRole) return false;
  
  // Normalize to array
  const required = Array.isArray(requiredRoles) ? requiredRoles : [requiredRoles];
  
  // Direct role match
  return required.includes(userRole);
};

/**
 * Check if user is admin
 * @param {Object} user - User object with userType property
 * @returns {boolean} - True if user is admin
 */
export const isAdmin = (user) => {
  return user && user.userType === ROLES.ADMIN;
};

/**
 * Check if user is pet owner
 * @param {Object} user - User object with userType property
 * @returns {boolean} - True if user is pet owner
 */
export const isPetOwner = (user) => {
  return user && user.userType === ROLES.PET_OWNER;
};

/**
 * Format role for display
 * @param {string} role - Role string
 * @returns {string} - Formatted role name
 */
export const formatRole = (role) => {
  const roleNames = {
    admin: 'Administrator',
    pet_owner: 'Pet Owner'
  };
  return roleNames[role] || role;
};

/**
 * Get user's dashboard route based on role
 * @param {Object} user - User object with userType property
 * @returns {string} - Dashboard route
 */
export const getUserDashboardRoute = (user) => {
  if (isAdmin(user)) {
    return '/admin/dashboard';
  }
  return '/dashboard';
};

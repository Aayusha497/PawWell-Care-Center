/**
 * Role-Based Access Control (RBAC) Utilities
 * 
 * Defines roles and provides helper functions for authorization
 */

/**
 * System Roles
 * Defines all available roles in the system
 */
const ROLES = {
  ADMIN: 'admin',
  PET_OWNER: 'pet_owner',
  USER: 'pet_owner' // Alias for clarity
};

/**
 * Role Hierarchies (optional - for future extension)
 * Higher level roles inherit lower level permissions
 */
const ROLE_HIERARCHY = {
  admin: ['admin', 'pet_owner'],
  pet_owner: ['pet_owner']
};

/**
 * Check if a user has the required role
 * @param {string} userRole - The user's role
 * @param {string|string[]} requiredRoles - Required role(s)
 * @param {boolean} useHierarchy - Whether to check role hierarchy
 * @returns {boolean} - True if user has required role
 */
const hasRole = (userRole, requiredRoles, useHierarchy = false) => {
  if (!userRole) return false;
  
  // Normalize to array
  const required = Array.isArray(requiredRoles) ? requiredRoles : [requiredRoles];
  
  // Direct role match
  if (required.includes(userRole)) {
    return true;
  }
  
  // Check hierarchy if enabled
  if (useHierarchy && ROLE_HIERARCHY[userRole]) {
    return required.some(role => ROLE_HIERARCHY[userRole].includes(role));
  }
  
  return false;
};

/**
 * Check if user is admin
 * @param {Object} user - User object with userType property
 * @returns {boolean} - True if user is admin
 */
const isAdmin = (user) => {
  return user && user.userType === ROLES.ADMIN;
};

/**
 * Check if user is pet owner
 * @param {Object} user - User object with userType property
 * @returns {boolean} - True if user is pet owner
 */
const isPetOwner = (user) => {
  return user && user.userType === ROLES.PET_OWNER;
};

/**
 * Format role for display
 * @param {string} role - Role string
 * @returns {string} - Formatted role name
 */
const formatRole = (role) => {
  const roleNames = {
    admin: 'Administrator',
    pet_owner: 'Pet Owner'
  };
  return roleNames[role] || role;
};

module.exports = {
  ROLES,
  ROLE_HIERARCHY,
  hasRole,
  isAdmin,
  isPetOwner,
  formatRole
};

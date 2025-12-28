const jwt = require('jsonwebtoken');
const config = require('../config/config');
const { User } = require('../models');
const { ROLES, hasRole, isAdmin } = require('../utils/rbac');

/**
 * Middleware to verify JWT token and authenticate user
 */
const authenticate = async (req, res, next) => {
  try {
    // Get token from header
    const authHeader = req.headers.authorization;
    
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({
        success: false,
        message: 'No token provided. Authentication required.'
      });
    }

    // Extract token
    const token = authHeader.split(' ')[1];

    // Verify token
    const decoded = jwt.verify(token, config.jwt.secret);

    // Get user from database
    const user = await User.findByPk(decoded.userId);

    if (!user) {
      return res.status(401).json({
        success: false,
        message: 'User not found. Token invalid.'
      });
    }

    // Check if user is active
    if (!user.isActive) {
      return res.status(403).json({
        success: false,
        message: 'Your account has been deactivated. Please contact support.'
      });
    }

    // Attach user to request object
    req.user = user;
    next();
  } catch (error) {
    if (error.name === 'JsonWebTokenError') {
      return res.status(401).json({
        success: false,
        message: 'Invalid token.'
      });
    }
    
    if (error.name === 'TokenExpiredError') {
      return res.status(401).json({
        success: false,
        message: 'Token expired. Please login again.'
      });
    }

    return res.status(500).json({
      success: false,
      message: 'Authentication error.',
      error: error.message
    });
  }
};

/**
 * Optional authentication - doesn't fail if no token provided
 */
const optionalAuthenticate = async (req, res, next) => {
  try {
    const authHeader = req.headers.authorization;
    
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return next();
    }

    const token = authHeader.split(' ')[1];
    const decoded = jwt.verify(token, config.jwt.secret);
    const user = await User.findByPk(decoded.userId);

    if (user && user.isActive) {
      req.user = user;
    }
    
    next();
  } catch (error) {
    // Silently fail for optional auth
    next();
  }
};

/**
 * Check if user has required user type
 */
const requireUserType = (...allowedTypes) => {
  return (req, res, next) => {
    if (!req.user) {
      return res.status(401).json({
        success: false,
        message: 'Authentication required.'
      });
    }

    if (!allowedTypes.includes(req.user.userType)) {
      return res.status(403).json({
        success: false,
        message: 'You do not have permission to access this resource.'
      });
    }

    next();
  };
};

/**
 * RBAC Middleware - Require specific role(s)
 * 
 * Usage:
 *   router.get('/admin/users', authenticate, requireRole([ROLES.ADMIN]), controller)
 *   router.post('/pets', authenticate, requireRole(ROLES.PET_OWNER), controller)
 * 
 * @param {string|string[]} allowedRoles - Single role or array of allowed roles
 * @returns {Function} Express middleware function
 */
const requireRole = (allowedRoles) => {
  return (req, res, next) => {
    // Ensure user is authenticated first
    if (!req.user) {
      return res.status(401).json({
        success: false,
        message: 'Authentication required.',
        code: 'AUTH_REQUIRED'
      });
    }

    // Check if user has required role
    if (!hasRole(req.user.userType, allowedRoles)) {
      const roles = Array.isArray(allowedRoles) ? allowedRoles.join(', ') : allowedRoles;
      return res.status(403).json({
        success: false,
        message: `Access denied. Required role(s): ${roles}`,
        code: 'INSUFFICIENT_PERMISSIONS',
        requiredRoles: Array.isArray(allowedRoles) ? allowedRoles : [allowedRoles],
        userRole: req.user.userType
      });
    }

    next();
  };
};

/**
 * Require Admin Role - Shorthand middleware
 */
const requireAdmin = (req, res, next) => {
  if (!req.user) {
    return res.status(401).json({
      success: false,
      message: 'Authentication required.',
      code: 'AUTH_REQUIRED'
    });
  }

  if (!isAdmin(req.user)) {
    return res.status(403).json({
      success: false,
      message: 'Access denied. Administrator privileges required.',
      code: 'ADMIN_REQUIRED',
      userRole: req.user.userType
    });
  }

  next();
};

/**
 * Resource Ownership Validation Middleware
 * Ensures user can only access their own resources
 * Admins bypass ownership checks
 * 
 * @param {string} resourceIdParam - Request parameter name for resource ID
 * @param {string} ownerIdField - Field name in resource that contains owner ID
 * @param {Function} getResource - Async function to fetch resource
 * @returns {Function} Express middleware function
 */
const checkOwnership = (resourceIdParam, ownerIdField, getResource) => {
  return async (req, res, next) => {
    try {
      // Ensure user is authenticated
      if (!req.user) {
        return res.status(401).json({
          success: false,
          message: 'Authentication required.',
          code: 'AUTH_REQUIRED'
        });
      }

      // Admins bypass ownership checks
      if (isAdmin(req.user)) {
        return next();
      }

      // Get resource ID from request
      const resourceId = req.params[resourceIdParam];
      
      if (!resourceId) {
        return res.status(400).json({
          success: false,
          message: 'Resource ID is required.',
          code: 'INVALID_REQUEST'
        });
      }

      // Fetch the resource
      const resource = await getResource(resourceId);

      if (!resource) {
        return res.status(404).json({
          success: false,
          message: 'Resource not found.',
          code: 'RESOURCE_NOT_FOUND'
        });
      }

      // Check ownership
      const ownerId = resource[ownerIdField];
      if (ownerId !== req.user.id) {
        return res.status(403).json({
          success: false,
          message: 'Access denied. You can only access your own resources.',
          code: 'OWNERSHIP_REQUIRED'
        });
      }

      // Attach resource to request for reuse in controller
      req.resource = resource;
      next();
    } catch (error) {
      console.error('Ownership check error:', error);
      return res.status(500).json({
        success: false,
        message: 'Error validating resource ownership.',
        error: error.message
      });
    }
  };
};

/**
 * Simple Ownership Check - Validates userId parameter matches authenticated user
 * Admins bypass this check
 */
const checkUserIdOwnership = (req, res, next) => {
  if (!req.user) {
    return res.status(401).json({
      success: false,
      message: 'Authentication required.',
      code: 'AUTH_REQUIRED'
    });
  }

  // Admins can access any user's data
  if (isAdmin(req.user)) {
    return next();
  }

  // Check if userId in params/body matches authenticated user
  const targetUserId = req.params.userId || req.body.userId;
  
  if (targetUserId && parseInt(targetUserId) !== req.user.id) {
    return res.status(403).json({
      success: false,
      message: 'Access denied. You can only access your own data.',
      code: 'OWNERSHIP_REQUIRED'
    });
  }

  next();
};

/**
 * Check if user is staff
 */
const requireStaff = (req, res, next) => {
  if (!req.user) {
    return res.status(401).json({
      success: false,
      message: 'Authentication required.'
    });
  }

  if (!req.user.isStaff) {
    return res.status(403).json({
      success: false,
      message: 'Staff access required.'
    });
  }

  next();
};

/**
 * Check if user is superuser/admin
 */
const requireSuperuser = (req, res, next) => {
  if (!req.user) {
    return res.status(401).json({
      success: false,
      message: 'Authentication required.'
    });
  }

  if (!req.user.isSuperuser) {
    return res.status(403).json({
      success: false,
      message: 'Admin access required.'
    });
  }

  next();
};

module.exports = {
  authenticate,
  optionalAuthenticate,
  requireUserType,
  requireRole,
  requireAdmin,
  checkOwnership,
  checkUserIdOwnership,
  requireStaff,
  requireSuperuser
};

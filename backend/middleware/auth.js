const jwt = require('jsonwebtoken');
const config = require('../config/config');
const { User } = require('../models');

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
  requireStaff,
  requireSuperuser
};

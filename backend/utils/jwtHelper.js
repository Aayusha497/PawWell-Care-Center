const jwt = require('jsonwebtoken');
const config = require('../config/config');

/**
 * Generate JWT access token
 */
const generateAccessToken = (userId) => {
  return jwt.sign(
    { userId, type: 'access' },
    config.jwt.secret,
    { expiresIn: config.jwt.accessTokenExpire }
  );
};

/**
 * Generate JWT refresh token
 */
const generateRefreshToken = (userId) => {
  return jwt.sign(
    { userId, type: 'refresh' },
    config.jwt.secret,
    { expiresIn: config.jwt.refreshTokenExpire }
  );
};

/**
 * Generate both access and refresh tokens
 */
const generateTokens = (userId) => {
  const accessToken = generateAccessToken(userId);
  const refreshToken = generateRefreshToken(userId);
  
  return { accessToken, refreshToken };
};

/**
 * Verify JWT token
 */
const verifyToken = (token) => {
  try {
    return jwt.verify(token, config.jwt.secret);
  } catch (error) {
    return null;
  }
};

/**
 * Calculate token expiry time in milliseconds
 * @returns {number|null} Milliseconds until expiry
 */
const getTokenExpiry = (expiresIn) => {
  const match = expiresIn.match(/^(\d+)([mhd])$/);
  if (!match) return null;
  
  const value = parseInt(match[1]);
  const unit = match[2];
  
  switch (unit) {
    case 'm':
      return value * 60 * 1000;
    case 'h':
      return value * 60 * 60 * 1000;
    case 'd':
      return value * 24 * 60 * 60 * 1000;
    default:
      return null;
  }
};

module.exports = {
  generateAccessToken,
  generateRefreshToken,
  generateTokens,
  verifyToken,
  getTokenExpiry
};

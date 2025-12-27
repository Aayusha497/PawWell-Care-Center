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
 * Calculate token expiry time
 */
const getTokenExpiry = (expiresIn) => {
  const match = expiresIn.match(/^(\d+)([mhd])$/);
  if (!match) return null;
  
  const value = parseInt(match[1]);
  const unit = match[2];
  
  const now = new Date();
  
  switch (unit) {
    case 'm':
      return new Date(now.getTime() + value * 60 * 1000);
    case 'h':
      return new Date(now.getTime() + value * 60 * 60 * 1000);
    case 'd':
      return new Date(now.getTime() + value * 24 * 60 * 60 * 1000);
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

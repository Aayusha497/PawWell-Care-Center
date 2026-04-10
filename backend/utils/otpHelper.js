const crypto = require('crypto');
const bcrypt = require('bcrypt');

/**
 * Generate a random 6-digit OTP
 */
const generateOTP = () => {
  return Math.floor(100000 + Math.random() * 900000).toString();
};

/**
 * Hash an OTP using bcrypt
 */
const hashOTP = async (otp) => {
  const saltRounds = 10;
  return await bcrypt.hash(otp, saltRounds);
};

/**
 * Verify OTP against hash
 */
const verifyOTPHash = async (otp, hash) => {
  return await bcrypt.compare(otp, hash);
};

module.exports = {
  generateOTP,
  hashOTP,
  verifyOTPHash
};

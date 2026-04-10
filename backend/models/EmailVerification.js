const { DataTypes } = require('sequelize');
const { sequelize } = require('../config/database');
const bcrypt = require('bcrypt');

const EmailVerification = sequelize.define('EmailVerification', {
  id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true
  },
  userId: {
    type: DataTypes.INTEGER,
    allowNull: false,
    field: 'user_id',
    references: {
      model: 'users',
      key: 'id'
    },
    onDelete: 'CASCADE'
  },
  otpHash: {
    type: DataTypes.STRING,
    allowNull: false,
    field: 'otp_hash'
  },
  otpAttempts: {
    type: DataTypes.INTEGER,
    defaultValue: 0,
    field: 'otp_attempts'
  },
  maxOtpAttempts: {
    type: DataTypes.INTEGER,
    defaultValue: 5,
    field: 'max_otp_attempts'
  },
  isVerified: {
    type: DataTypes.BOOLEAN,
    defaultValue: false,
    field: 'is_verified'
  },
  expiresAt: {
    type: DataTypes.DATE,
    allowNull: false,
    field: 'expires_at'
  },
  createdAt: {
    type: DataTypes.DATE,
    defaultValue: DataTypes.NOW,
    field: 'created_at'
  },
  updatedAt: {
    type: DataTypes.DATE,
    defaultValue: DataTypes.NOW,
    field: 'updated_at'
  }
}, {
  tableName: 'email_verifications',
  timestamps: true,
  underscored: false
});

// Helper method to check if OTP is expired
EmailVerification.prototype.isExpired = function() {
  return new Date() > this.expiresAt;
};

// Helper method to increment attempts
EmailVerification.prototype.incrementAttempts = async function() {
  this.otpAttempts += 1;
  await this.save();
};

// Helper method to verify OTP
EmailVerification.prototype.verifyOTP = async function(otp) {
  return await bcrypt.compare(otp, this.otpHash);
};

module.exports = EmailVerification;

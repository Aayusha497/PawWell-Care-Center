const { DataTypes } = require('sequelize');
const { sequelize } = require('../config/database');

const PendingRegistration = sequelize.define('PendingRegistration', {
  id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true
  },
  email: {
    type: DataTypes.STRING,
    allowNull: false,
    unique: true,
    field: 'email'
  },
  password: {
    type: DataTypes.STRING,
    allowNull: false,
    field: 'password'
  },
  firstName: {
    type: DataTypes.STRING,
    allowNull: false,
    field: 'first_name'
  },
  lastName: {
    type: DataTypes.STRING,
    allowNull: false,
    field: 'last_name'
  },
  phoneNumber: {
    type: DataTypes.STRING,
    allowNull: true,
    field: 'phone_number'
  },
  userType: {
    type: DataTypes.STRING,
    defaultValue: 'pet_owner',
    field: 'user_type'
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
  }
}, {
  tableName: 'pending_registrations',
  timestamps: false
});

// Helper methods
PendingRegistration.prototype.isExpired = function() {
  return new Date() > this.expiresAt;
};

PendingRegistration.prototype.incrementAttempts = async function() {
  this.otpAttempts += 1;
  await this.save();
};

PendingRegistration.prototype.verifyOTP = async function(otp) {
  const bcrypt = require('bcrypt');
  return await bcrypt.compare(otp, this.otpHash);
};

module.exports = PendingRegistration;

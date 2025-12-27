const { DataTypes } = require('sequelize');
const { sequelize } = require('../config/database');
const { v4: uuidv4 } = require('uuid');

const PasswordReset = sequelize.define('PasswordReset', {
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
  token: {
    type: DataTypes.UUID,
    defaultValue: uuidv4,
    unique: true,
    allowNull: false
  },
  isUsed: {
    type: DataTypes.BOOLEAN,
    defaultValue: false,
    field: 'is_used'
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
  tableName: 'password_resets',
  timestamps: false,
  hooks: {
    beforeCreate: (reset) => {
      if (!reset.expiresAt) {
        // Set expiration to 1 hour from now
        reset.expiresAt = new Date(Date.now() + 60 * 60 * 1000);
      }
    }
  }
});

// Instance methods
PasswordReset.prototype.isExpired = function() {
  return new Date() > this.expiresAt;
};

PasswordReset.prototype.canReset = function() {
  return !this.isUsed && !this.isExpired();
};

module.exports = PasswordReset;

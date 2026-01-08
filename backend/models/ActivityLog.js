/**
 * Activity Log Model
 * 
 * Represents user activity logs for tracking and auditing
 */

const { DataTypes } = require('sequelize');

module.exports = (sequelize) => {
  const ActivityLog = sequelize.define('ActivityLog', {
    activity_id: {
      type: DataTypes.INTEGER,
      primaryKey: true,
      autoIncrement: true,
      field: 'activity_id'
    },
    user_id: {
      type: DataTypes.INTEGER,
      allowNull: false,
      field: 'user_id',
      references: {
        model: 'users',
        key: 'id'
      }
    },
    activity_type: {
      type: DataTypes.STRING(100),
      allowNull: false,
      field: 'activity_type'
    },
    timestamp: {
      type: DataTypes.DATE,
      allowNull: false,
      defaultValue: DataTypes.NOW
    },
    detail: {
      type: DataTypes.TEXT,
      allowNull: true
    },
    ip_address: {
      type: DataTypes.STRING(45),
      allowNull: true,
      field: 'ip_address'
    },
    user_agent: {
      type: DataTypes.TEXT,
      allowNull: true,
      field: 'user_agent'
    }
  }, {
    tableName: 'activity_logs',
    timestamps: false,
    underscored: true
  });

  ActivityLog.associate = (models) => {
    ActivityLog.belongsTo(models.User, {
      foreignKey: 'user_id',
      as: 'user'
    });
  };

  return ActivityLog;
};

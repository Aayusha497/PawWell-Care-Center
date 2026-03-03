/**
 * Notification Model
 * 
 * Represents notifications for users about bookings, pets, emergencies, etc.
 */

const { DataTypes } = require('sequelize');

module.exports = (sequelize) => {
  const Notification = sequelize.define('Notification', {
    notification_id: {
      type: DataTypes.INTEGER,
      primaryKey: true,
      autoIncrement: true,
      field: 'notification_id'
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
    type: {
      type: DataTypes.STRING(50),
      allowNull: false,
      defaultValue: 'booking_created',
      field: 'type'
    },
    title: {
      type: DataTypes.STRING(255),
      allowNull: true,
      field: 'title'
    },
    message: {
      type: DataTypes.TEXT,
      allowNull: false,
      field: 'message'
    },
    reference_type: {
      type: DataTypes.STRING(50),
      allowNull: true,
      field: 'reference_type'
    },
    reference_id: {
      type: DataTypes.INTEGER,
      allowNull: true,
      field: 'reference_id'
    },
    is_read: {
      type: DataTypes.BOOLEAN,
      allowNull: false,
      defaultValue: false,
      field: 'is_read'
    }
  }, {
    tableName: 'notifications',
    timestamps: true,
    underscored: true,
    createdAt: 'created_at',
    updatedAt: 'updated_at'
  });

  Notification.associate = (models) => {
    Notification.belongsTo(models.User, {
      foreignKey: 'user_id',
      as: 'user'
    });
  };

  return Notification;
};

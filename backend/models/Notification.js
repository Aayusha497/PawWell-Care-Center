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
      type: DataTypes.ENUM(
        'booking_created',
        'booking_approved', 
        'booking_rejected',
        'booking_completed',
        'booking_cancelled',
        'pet_created',
        'pet_updated',
        'emergency_created',
        'emergency_updated',
        'emergency_resolved'
      ),
      allowNull: false,
      field: 'type'
    },
    title: {
      type: DataTypes.STRING,
      allowNull: false,
      field: 'title'
    },
    message: {
      type: DataTypes.TEXT,
      allowNull: false,
      field: 'message'
    },
    reference_type: {
      type: DataTypes.ENUM('booking', 'pet', 'emergency', 'activity'),
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

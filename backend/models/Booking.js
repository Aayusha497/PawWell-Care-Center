/**
 * Booking Model
 * 
 * Represents service bookings made by users
 */

const { DataTypes } = require('sequelize');

module.exports = (sequelize) => {
  const Booking = sequelize.define('Booking', {
    booking_id: {
      type: DataTypes.INTEGER,
      primaryKey: true,
      autoIncrement: true,
      field: 'booking_id'
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
    pet_id: {
      type: DataTypes.INTEGER,
      allowNull: false,
      field: 'pet_id',
      references: {
        model: 'pets',
        key: 'pet_id'
      }
    },
    service_id: {
      type: DataTypes.INTEGER,
      allowNull: true,
      field: 'service_id',
      references: {
        model: 'services',
        key: 'service_id'
      }
    },
    service_type: {
      type: DataTypes.STRING(100),
      allowNull: false,
      field: 'service_type'
    },
    price: {
      type: DataTypes.DECIMAL(10, 2),
      allowNull: false
    },
    date: {
      type: DataTypes.DATE,
      allowNull: false
    },
    status: {
      type: DataTypes.ENUM('pending', 'confirmed', 'completed', 'cancelled'),
      allowNull: false,
      defaultValue: 'pending'
    },
    payment_method: {
      type: DataTypes.STRING(50),
      allowNull: true,
      field: 'payment_method'
    },
    confirmation_code: {
      type: DataTypes.STRING(50),
      allowNull: true,
      unique: true,
      field: 'confirmation_code'
    }
  }, {
    tableName: 'bookings',
    timestamps: true,
    underscored: true,
    createdAt: 'created_at',
    updatedAt: 'updated_at'
  });

  Booking.associate = (models) => {
    Booking.belongsTo(models.User, {
      foreignKey: 'user_id',
      as: 'user'
    });
    Booking.belongsTo(models.Pet, {
      foreignKey: 'pet_id',
      as: 'pet'
    });
    Booking.belongsTo(models.Service, {
      foreignKey: 'service_id',
      as: 'service'
    });
    Booking.hasOne(models.Payment, {
      foreignKey: 'booking_id',
      as: 'payment'
    });
  };

  return Booking;
};

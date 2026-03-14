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
    start_date: {
      type: DataTypes.DATE,
      allowNull: false,
      field: 'start_date'
    },
    end_date: {
      type: DataTypes.DATE,
      allowNull: true,
      field: 'end_date'
    },
    number_of_days: {
      type: DataTypes.INTEGER,
      allowNull: false,
      defaultValue: 1,
      field: 'number_of_days'
    },
    requires_pickup: {
      type: DataTypes.BOOLEAN,
      allowNull: false,
      defaultValue: false,
      field: 'requires_pickup'
    },
    pickup_address: {
      type: DataTypes.STRING(500),
      allowNull: true,
      field: 'pickup_address'
    },
    pickup_time: {
      type: DataTypes.STRING(50),
      allowNull: true,
      field: 'pickup_time'
    },
    dropoff_address: {
      type: DataTypes.STRING(500),
      allowNull: true,
      field: 'dropoff_address'
    },
    dropoff_time: {
      type: DataTypes.STRING(50),
      allowNull: true,
      field: 'dropoff_time'
    },
    status: {
      type: DataTypes.ENUM('pending', 'confirmed', 'completed', 'cancelled'),
      allowNull: false,
      defaultValue: 'pending'
    },
    booking_status: {
      type: DataTypes.ENUM('pending', 'approved', 'confirmed', 'completed', 'rejected', 'cancelled'),
      allowNull: false,
      defaultValue: 'pending',
      field: 'booking_status'
    },
    payment_status: {
      type: DataTypes.ENUM('unpaid', 'pending_payment', 'paid', 'failed'),
      allowNull: false,
      defaultValue: 'unpaid',
      field: 'payment_status'
    },
    payment_method: {
      type: DataTypes.STRING(50),
      allowNull: true,
      field: 'payment_method'
    },
    transaction_id: {
      type: DataTypes.STRING(255),
      allowNull: true,
      field: 'transaction_id'
    },
    pidx: {
      type: DataTypes.STRING(255),
      allowNull: true,
      field: 'pidx'
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
    Booking.hasOne(models.Review, {
      foreignKey: 'booking_id',
      as: 'review'
    });
  };

  return Booking;
};

/**
 * Payment Model
 * 
 * Represents payments for bookings
 */

const { DataTypes } = require('sequelize');

module.exports = (sequelize) => {
  const Payment = sequelize.define('Payment', {
    payment_id: {
      type: DataTypes.INTEGER,
      primaryKey: true,
      autoIncrement: true,
      field: 'payment_id'
    },
    booking_id: {
      type: DataTypes.INTEGER,
      allowNull: false,
      unique: true,
      field: 'booking_id',
      references: {
        model: 'bookings',
        key: 'booking_id'
      }
    },
    amount: {
      type: DataTypes.DECIMAL(10, 2),
      allowNull: false
    },
    payment_method: {
      type: DataTypes.STRING(50),
      allowNull: false,
      field: 'payment_method'
    },
    transaction_details: {
      type: DataTypes.TEXT,
      allowNull: true,
      field: 'transaction_details'
    },
    payment_date: {
      type: DataTypes.DATE,
      allowNull: false,
      defaultValue: DataTypes.NOW,
      field: 'payment_date'
    }
  }, {
    tableName: 'payments',
    timestamps: true,
    underscored: true,
    createdAt: 'created_at',
    updatedAt: 'updated_at'
  });

  Payment.associate = (models) => {
    Payment.belongsTo(models.Booking, {
      foreignKey: 'booking_id',
      as: 'booking'
    });
    Payment.hasOne(models.Receipt, {
      foreignKey: 'payment_id',
      as: 'receipt'
    });
  };

  return Payment;
};

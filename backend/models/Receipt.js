/**
 * Receipt Model
 * 
 * Represents receipts for payments
 */

const { DataTypes } = require('sequelize');

module.exports = (sequelize) => {
  const Receipt = sequelize.define('Receipt', {
    receipt_id: {
      type: DataTypes.INTEGER,
      primaryKey: true,
      autoIncrement: true,
      field: 'receipt_id'
    },
    payment_id: {
      type: DataTypes.INTEGER,
      allowNull: false,
      unique: true,
      field: 'payment_id',
      references: {
        model: 'payments',
        key: 'payment_id'
      }
    },
    receipt_date: {
      type: DataTypes.DATE,
      allowNull: false,
      defaultValue: DataTypes.NOW,
      field: 'receipt_date'
    },
    details: {
      type: DataTypes.TEXT,
      allowNull: true
    }
  }, {
    tableName: 'receipts',
    timestamps: true,
    underscored: true,
    createdAt: 'created_at',
    updatedAt: 'updated_at'
  });

  Receipt.associate = (models) => {
    Receipt.belongsTo(models.Payment, {
      foreignKey: 'payment_id',
      as: 'payment'
    });
  };

  return Receipt;
};

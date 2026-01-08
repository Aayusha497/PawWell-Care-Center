/**
 * Service Model
 * 
 * Represents services offered by PawWell
 */

const { DataTypes } = require('sequelize');

module.exports = (sequelize) => {
  const Service = sequelize.define('Service', {
    service_id: {
      type: DataTypes.INTEGER,
      primaryKey: true,
      autoIncrement: true,
      field: 'service_id'
    },
    name: {
      type: DataTypes.STRING(100),
      allowNull: false
    },
    description: {
      type: DataTypes.TEXT,
      allowNull: true
    },
    base_price: {
      type: DataTypes.DECIMAL(10, 2),
      allowNull: false,
      field: 'base_price'
    }
  }, {
    tableName: 'services',
    timestamps: true,
    underscored: true,
    createdAt: 'created_at',
    updatedAt: 'updated_at'
  });

  Service.associate = (models) => {
    Service.hasMany(models.Booking, {
      foreignKey: 'service_id',
      as: 'bookings'
    });
  };

  return Service;
};

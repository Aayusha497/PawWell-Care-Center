/**
 * Emergency Request Model
 * 
 * Represents emergency requests for pets
 */

const { DataTypes } = require('sequelize');

module.exports = (sequelize) => {
  const EmergencyRequest = sequelize.define('EmergencyRequest', {
    emergency_id: {
      type: DataTypes.INTEGER,
      primaryKey: true,
      autoIncrement: true,
      field: 'emergency_id'
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
    emergency_type: {
      type: DataTypes.STRING(100),
      allowNull: false,
      field: 'emergency_type'
    },
    description: {
      type: DataTypes.TEXT,
      allowNull: true,
      field: 'description'
    },
    contact_info: {
      type: DataTypes.STRING(255),
      allowNull: false,
      field: 'contact_info'
    },
    date: {
      type: DataTypes.DATE,
      allowNull: false,
      defaultValue: DataTypes.NOW
    },
    status: {
      type: DataTypes.ENUM('pending', 'in_progress', 'resolved', 'cancelled'),
      allowNull: false,
      defaultValue: 'pending'
    }
  }, {
    tableName: 'emergency_requests',
    timestamps: true,
    underscored: true,
    createdAt: 'created_at',
    updatedAt: 'updated_at'
  });

  EmergencyRequest.associate = (models) => {
    EmergencyRequest.belongsTo(models.User, {
      foreignKey: 'user_id',
      as: 'user'
    });
    EmergencyRequest.belongsTo(models.Pet, {
      foreignKey: 'pet_id',
      as: 'pet'
    });
  };

  return EmergencyRequest;
};

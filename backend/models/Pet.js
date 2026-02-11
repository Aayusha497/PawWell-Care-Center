/**
 * Pet Model
 * 
 * Represents pets owned by users
 */

const { DataTypes } = require('sequelize');

module.exports = (sequelize) => {
  const Pet = sequelize.define('Pet', {
    pet_id: {
      type: DataTypes.INTEGER,
      primaryKey: true,
      autoIncrement: true,
      field: 'pet_id'
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
    name: {
      type: DataTypes.STRING(100),
      allowNull: false
    },
    breed: {
      type: DataTypes.STRING(100),
      allowNull: false
    },
    age: {
      type: DataTypes.INTEGER,
      allowNull: false
    },
    weight: {
      type: DataTypes.DECIMAL(5, 2),
      allowNull: false
    },
    height: {
      type: DataTypes.DECIMAL(5, 2),
      allowNull: false,
      field: 'height'
    },
    sex: {
      type: DataTypes.STRING(10),
      allowNull: false
    },
    allergies: {
      type: DataTypes.TEXT,
      allowNull: true
    },
    triggering_point: {
      type: DataTypes.TEXT,
      allowNull: true,
      field: 'triggering_point'
    },
    medical_history: {
      type: DataTypes.TEXT,
      allowNull: true,
      field: 'medical_history'
    },
    photo: {
      type: DataTypes.STRING(500),
      allowNull: false
    },
    deleted_at: {
      type: DataTypes.DATE,
      allowNull: true,
      field: 'deleted_at'
    }
  }, {
    tableName: 'pets',
    timestamps: true,
    underscored: true,
    createdAt: 'created_at',
    updatedAt: 'updated_at',
    paranoid: true,
    deletedAt: 'deleted_at'
  });

  Pet.associate = (models) => {
    Pet.belongsTo(models.User, {
      foreignKey: 'user_id',
      as: 'owner'
    });
    Pet.hasMany(models.EmergencyRequest, {
      foreignKey: 'pet_id',
      as: 'emergencyRequests'
    });
    Pet.hasMany(models.WellnessTimeline, {
      foreignKey: 'pet_id',
      as: 'wellnessRecords'
    });
    Pet.hasMany(models.Booking, {
      foreignKey: 'pet_id',
      as: 'bookings'
    });
    Pet.hasMany(models.ActivityLog, {
      foreignKey: 'pet_id',
      as: 'activityLogs'
    });
  };

  return Pet;
};

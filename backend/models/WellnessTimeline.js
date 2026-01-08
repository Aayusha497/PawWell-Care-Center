/**
 * Wellness Timeline Model
 * 
 * Represents wellness timeline entries for pets
 */

const { DataTypes } = require('sequelize');

module.exports = (sequelize) => {
  const WellnessTimeline = sequelize.define('WellnessTimeline', {
    timeline_id: {
      type: DataTypes.INTEGER,
      primaryKey: true,
      autoIncrement: true,
      field: 'timeline_id'
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
    date: {
      type: DataTypes.DATE,
      allowNull: false,
      defaultValue: DataTypes.NOW
    },
    type: {
      type: DataTypes.STRING(50),
      allowNull: false
    },
    title: {
      type: DataTypes.STRING(200),
      allowNull: false
    },
    description: {
      type: DataTypes.TEXT,
      allowNull: true
    }
  }, {
    tableName: 'wellness_timeline',
    timestamps: true,
    underscored: true,
    createdAt: 'created_at',
    updatedAt: 'updated_at'
  });

  WellnessTimeline.associate = (models) => {
    WellnessTimeline.belongsTo(models.Pet, {
      foreignKey: 'pet_id',
      as: 'pet'
    });
  };

  return WellnessTimeline;
};

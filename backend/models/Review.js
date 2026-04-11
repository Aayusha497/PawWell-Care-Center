/**
 * Review Model
 * 
 * Represents customer reviews and ratings for completed bookings
 * Requires: booking confirmed, payment made, service completed
 */

const { DataTypes } = require('sequelize');

module.exports = (sequelize) => {
  const Review = sequelize.define('Review', {
    review_id: {
      type: DataTypes.INTEGER,
      primaryKey: true,
      autoIncrement: true,
      field: 'review_id'
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
      allowNull: true,
      field: 'pet_id',
      references: {
        model: 'pets',
        key: 'pet_id'
      }
    },
    service_type: {
      type: DataTypes.STRING(100),
      allowNull: false,
      field: 'service_type'
    },
    rating: {
      type: DataTypes.INTEGER,
      allowNull: false,
      field: 'rating',
      validate: {
        min: 1,
        max: 5
      }
    },
    comment: {
      type: DataTypes.TEXT,
      allowNull: true,
      field: 'comment'
    },
    is_approved: {
      type: DataTypes.BOOLEAN,
      allowNull: false,
      defaultValue: false,
      field: 'is_approved'
    },
    is_featured: {
      type: DataTypes.BOOLEAN,
      allowNull: false,
      defaultValue: false,
      field: 'is_featured'
    },
    rejection_reason: {
      type: DataTypes.TEXT,
      allowNull: true,
      field: 'rejection_reason'
    }
  }, {
    tableName: 'reviews',
    timestamps: true,
    underscored: true,
    createdAt: 'created_at',
    updatedAt: 'updated_at'
  });

  Review.associate = (models) => {
    Review.belongsTo(models.Booking, {
      foreignKey: 'booking_id',
      as: 'booking'
    });
    Review.belongsTo(models.User, {
      foreignKey: 'user_id',
      as: 'user'
    });
    Review.belongsTo(models.Pet, {
      foreignKey: 'pet_id',
      as: 'pet'
    });
  };

  return Review;
};

/**
 * Review Model
 * 
 * Represents customer reviews and ratings for completed bookings
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
    rating_service: {
      type: DataTypes.INTEGER,
      allowNull: false,
      field: 'rating_service',
      validate: {
        min: 1,
        max: 5
      }
    },
    rating_staff: {
      type: DataTypes.INTEGER,
      allowNull: false,
      field: 'rating_staff',
      validate: {
        min: 1,
        max: 5
      }
    },
    rating_cleanliness: {
      type: DataTypes.INTEGER,
      allowNull: false,
      field: 'rating_cleanliness',
      validate: {
        min: 1,
        max: 5
      }
    },
    rating_value: {
      type: DataTypes.INTEGER,
      allowNull: false,
      field: 'rating_value',
      validate: {
        min: 1,
        max: 5
      }
    },
    rating_communication: {
      type: DataTypes.INTEGER,
      allowNull: false,
      field: 'rating_communication',
      validate: {
        min: 1,
        max: 5
      }
    },
    rating_pet_condition: {
      type: DataTypes.INTEGER,
      allowNull: false,
      field: 'rating_pet_condition',
      validate: {
        min: 1,
        max: 5
      }
    },
    overall_rating: {
      type: DataTypes.DECIMAL(2, 1),
      allowNull: false,
      field: 'overall_rating'
    },
    review_text: {
      type: DataTypes.TEXT,
      allowNull: true,
      field: 'review_text'
    },
    photos: {
      type: DataTypes.STRING(1000),
      allowNull: true,
      field: 'photos'
    },
    is_verified: {
      type: DataTypes.BOOLEAN,
      allowNull: false,
      defaultValue: true,
      field: 'is_verified'
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
    admin_response: {
      type: DataTypes.TEXT,
      allowNull: true,
      field: 'admin_response'
    },
    admin_response_date: {
      type: DataTypes.DATE,
      allowNull: true,
      field: 'admin_response_date'
    },
    helpful_count: {
      type: DataTypes.INTEGER,
      allowNull: false,
      defaultValue: 0,
      field: 'helpful_count'
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

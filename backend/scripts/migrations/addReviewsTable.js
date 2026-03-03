/**
 * Add Reviews Table Migration
 * 
 * Creates the reviews table for customer ratings and reviews
 */

const { sequelize } = require('../config/database');
const { DataTypes } = require('sequelize');

async function up() {
  const queryInterface = sequelize.getQueryInterface();

  console.log('Creating reviews table...');

  await queryInterface.createTable('reviews', {
    review_id: {
      type: DataTypes.INTEGER,
      primaryKey: true,
      autoIncrement: true,
    },
    booking_id: {
      type: DataTypes.INTEGER,
      allowNull: false,
      unique: true,
      references: {
        model: 'bookings',
        key: 'booking_id',
      },
      onDelete: 'CASCADE',
    },
    user_id: {
      type: DataTypes.INTEGER,
      allowNull: false,
      references: {
        model: 'users',
        key: 'id',
      },
      onDelete: 'NO ACTION',
    },
    pet_id: {
      type: DataTypes.INTEGER,
      allowNull: true,
      references: {
        model: 'pets',
        key: 'pet_id',
      },
      onDelete: 'CASCADE',
    },
    service_type: {
      type: DataTypes.STRING(100),
      allowNull: false,
    },
    rating_service: {
      type: DataTypes.INTEGER,
      allowNull: false,
    },
    rating_staff: {
      type: DataTypes.INTEGER,
      allowNull: false,
    },
    rating_cleanliness: {
      type: DataTypes.INTEGER,
      allowNull: false,
    },
    rating_value: {
      type: DataTypes.INTEGER,
      allowNull: false,
    },
    rating_communication: {
      type: DataTypes.INTEGER,
      allowNull: false,
    },
    rating_pet_condition: {
      type: DataTypes.INTEGER,
      allowNull: false,
    },
    overall_rating: {
      type: DataTypes.DECIMAL(2, 1),
      allowNull: false,
    },
    review_text: {
      type: DataTypes.TEXT,
      allowNull: true,
    },
    photos: {
      type: DataTypes.STRING(1000),
      allowNull: true,
    },
    is_verified: {
      type: DataTypes.BOOLEAN,
      allowNull: false,
      defaultValue: true,
    },
    is_approved: {
      type: DataTypes.BOOLEAN,
      allowNull: false,
      defaultValue: false,
    },
    is_featured: {
      type: DataTypes.BOOLEAN,
      allowNull: false,
      defaultValue: false,
    },
    admin_response: {
      type: DataTypes.TEXT,
      allowNull: true,
    },
    admin_response_date: {
      type: DataTypes.DATE,
      allowNull: true,
    },
    helpful_count: {
      type: DataTypes.INTEGER,
      allowNull: false,
      defaultValue: 0,
    },
    created_at: {
      type: DataTypes.DATE,
      allowNull: false,
      defaultValue: DataTypes.NOW,
    },
    updated_at: {
      type: DataTypes.DATE,
      allowNull: false,
      defaultValue: DataTypes.NOW,
    },
  });

  // Create indexes
  await queryInterface.addIndex('reviews', ['user_id'], {
    name: 'idx_reviews_user',
  });

  await queryInterface.addIndex('reviews', ['is_approved', 'is_featured'], {
    name: 'idx_reviews_approved_featured',
  });

  await queryInterface.addIndex('reviews', ['service_type'], {
    name: 'idx_reviews_service_type',
  });

  console.log('Reviews table created successfully!');
}

async function down() {
  const queryInterface = sequelize.getQueryInterface();

  console.log('Dropping reviews table...');
  await queryInterface.dropTable('reviews');
  console.log('Reviews table dropped successfully!');
}

async function runMigration() {
  try {
    console.log('Starting reviews table migration...');
    await sequelize.authenticate();
    console.log('Database connection established.');

    await up();

    console.log('Migration completed successfully!');
    process.exit(0);
  } catch (error) {
    console.error('Migration failed:', error);
    process.exit(1);
  }
}

// Run migration if this file is executed directly
if (require.main === module) {
  runMigration();
}

module.exports = { up, down };

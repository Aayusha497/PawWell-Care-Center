/**
 * Migration: Update Reviews Table Schema
 * 
 * Changes:
 * - Replace 6 rating fields (rating_service, rating_staff, etc.) with single 'rating' field
 * - Rename 'review_text' to 'comment'
 * - Add 'rejection_reason' field for admin rejections
 * - Remove unused fields (photos, is_verified, admin_response, admin_response_date, helpful_count)
 * - Ensure is_approved defaults to false
 * - Ensure is_featured defaults to false
 */

const { DataTypes } = require('sequelize');

async function up(sequelize) {
  const queryInterface = sequelize.getQueryInterface();

  console.log('🔄 Starting reviews table migration...');

  try {
    // Get current table info
    const tableDescription = await queryInterface.describeTable('reviews');
    console.log('📊 Current reviews table columns:', Object.keys(tableDescription));

    // Drop old rating columns if they exist
    const oldRatingFields = [
      'rating_service',
      'rating_staff',
      'rating_cleanliness',
      'rating_value',
      'rating_communication',
      'rating_pet_condition',
      'overall_rating',
      'photos',
      'is_verified',
      'admin_response',
      'admin_response_date',
      'helpful_count',
    ];

    for (const field of oldRatingFields) {
      if (tableDescription[field]) {
        console.log(`🗑️ Dropping column: ${field}`);
        await queryInterface.removeColumn('reviews', field);
      }
    }

    // Rename review_text to comment if it exists
    if (tableDescription.review_text) {
      console.log('📝 Renaming review_text to comment...');
      await queryInterface.renameColumn('reviews', 'review_text', 'comment');
    }

    // Add new 'rating' column if it doesn't exist
    if (!tableDescription.rating) {
      console.log('⭐ Adding rating column...');
      await queryInterface.addColumn('reviews', 'rating', {
        type: DataTypes.INTEGER,
        allowNull: true,  // Allow null for existing records
        defaultValue: 5,  // Default to 5 stars for existing reviews
      });
      
      // Update existing reviews with default rating of 5
      console.log('🔄 Setting default rating (5 stars) for existing reviews...');
      await queryInterface.sequelize.query(
        'UPDATE "reviews" SET "rating" = 5 WHERE "rating" IS NULL'
      );
      
      // Now change to NOT NULL with default
      console.log(' Setting rating column to NOT NULL...');
      await queryInterface.changeColumn('reviews', 'rating', {
        type: DataTypes.INTEGER,
        allowNull: false,
        defaultValue: 5,
      });
    }

    // Add rejection_reason column if it doesn't exist
    if (!tableDescription.rejection_reason) {
      console.log('❌ Adding rejection_reason column...');
      await queryInterface.addColumn('reviews', 'rejection_reason', {
        type: DataTypes.TEXT,
        allowNull: true,
      });
    }

    // Update is_approved to default to false
    console.log('🔄 Updating is_approved default...');
    await queryInterface.changeColumn('reviews', 'is_approved', {
      type: DataTypes.BOOLEAN,
      allowNull: false,
      defaultValue: false,
    });

    // Update is_featured to default to false
    console.log('🔄 Updating is_featured default...');
    await queryInterface.changeColumn('reviews', 'is_featured', {
      type: DataTypes.BOOLEAN,
      allowNull: false,
      defaultValue: false,
    });

    console.log('✅ Reviews table migration completed successfully!');
  } catch (error) {
    console.error('❌ Migration error:', error.message);
    throw error;
  }
}

async function down(sequelize) {
  const queryInterface = sequelize.getQueryInterface();

  console.log('⏮️ Rolling back reviews table migration...');

  try {
    // This is a destructive rollback - in production, be careful
    console.log('⚠️ Rollback would require recreating the table. Manual intervention recommended.');
    console.log('Backup your data before rolling back!');
  } catch (error) {
    console.error('❌ Rollback error:', error.message);
    throw error;
  }
}

module.exports = { up, down };

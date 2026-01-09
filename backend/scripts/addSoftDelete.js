/**
 * Add soft delete column to pets table
 * This script adds deleted_at column for implementing soft delete
 */

const { sequelize } = require('../config/database');

async function addSoftDeleteColumn() {
  try {
    console.log('🔧 Adding deleted_at column to pets table...');
    
    // Add deleted_at column if it doesn't exist
    await sequelize.query(`
      ALTER TABLE pets 
      ADD COLUMN IF NOT EXISTS deleted_at TIMESTAMP NULL;
    `);
    
    console.log('✅ Successfully added deleted_at column to pets table');
    console.log('📌 Soft delete is now enabled for pet profiles');
    console.log('   - When pets are deleted, they are marked with deleted_at timestamp');
    console.log('   - Data is never actually removed from the database');
    console.log('   - Photos remain in Cloudinary for audit/recovery purposes');
    
    process.exit(0);
  } catch (error) {
    console.error('❌ Error adding soft delete column:', error.message);
    process.exit(1);
  }
}

addSoftDeleteColumn();

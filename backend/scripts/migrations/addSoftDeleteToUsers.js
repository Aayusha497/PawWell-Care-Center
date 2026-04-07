/**
 * Migration: Add soft delete (deleted_at) to users table
 * 
 * Adds deleted_at column to enable paranoid/soft delete mode
 * This allows users to delete their accounts without data loss
 */

const { sequelize } = require('../../config/database');
const { DataTypes } = require('sequelize');

const runMigration = async () => {
  try {
    console.log('🔄 Starting migration: Add soft delete to users table...\n');

    // Check if deleted_at column already exists
    const table = await sequelize.getQueryInterface().describeTable('users');
    
    if (table.deleted_at) {
      console.log('⚠️  Column deleted_at already exists in users table');
      process.exit(0);
    }

    // Add deleted_at column
    await sequelize.getQueryInterface().addColumn('users', 'deleted_at', {
      type: DataTypes.DATE,
      allowNull: true,
      defaultValue: null
    });

    console.log('✅ Successfully added deleted_at column to users table');
    console.log('\n📋 Migration Summary:');
    console.log('═══════════════════════════════════════════════════════════');
    console.log('✓ Column: deleted_at');
    console.log('✓ Type: TIMESTAMP');
    console.log('✓ Default: NULL');
    console.log('✓ When user deletes account: deleted_at gets current timestamp');
    console.log('═══════════════════════════════════════════════════════════');
    console.log('✨ Migration completed successfully!');
    
    process.exit(0);
  } catch (error) {
    console.error('❌ Migration failed:', error.message);
    process.exit(1);
  }
};

// Run migration
runMigration();

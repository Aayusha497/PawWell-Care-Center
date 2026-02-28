require('dotenv').config();
const { Pool } = require('pg');
const fs = require('fs');
const path = require('path');

/**
 * Run database migration script
 * Usage: node scripts/runMigration.js <migration_file_name>
 * Example: node scripts/runMigration.js 001_update_notifications_table.sql
 */

const runMigration = async () => {
  const migrationFile = process.argv[2];

  if (!migrationFile) {
    console.error('❌ Please provide a migration file name');
    console.log('Usage: node scripts/runMigration.js <migration_file_name>');
    console.log('Example: node scripts/runMigration.js 001_update_notifications_table.sql');
    process.exit(1);
  }

  const migrationPath = path.join(__dirname, 'migrations', migrationFile);

  if (!fs.existsSync(migrationPath)) {
    console.error(`❌ Migration file not found: ${migrationPath}`);
    process.exit(1);
  }

  const pool = new Pool({
    connectionString: process.env.DATABASE_URL
  });

  try {
    console.log(`🔄 Running migration: ${migrationFile}`);
    
    const migrationSQL = fs.readFileSync(migrationPath, 'utf8');
    
    await pool.query(migrationSQL);
    
    console.log('✅ Migration completed successfully!');
    
  } catch (error) {
    console.error('❌ Migration failed:', error.message);
    console.error(error);
    process.exit(1);
  } finally {
    await pool.end();
  }
};

runMigration();

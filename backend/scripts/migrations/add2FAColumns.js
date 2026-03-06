const { sequelize } = require('../../config/database');

async function add2FAColumns() {
  try {
    console.log('Adding 2FA columns to users table...');
    
    // Add two_factor_enabled column
    await sequelize.query(`
      ALTER TABLE users 
      ADD COLUMN IF NOT EXISTS two_factor_enabled BOOLEAN DEFAULT false;
    `);

    // Add two_factor_secret column (encrypted TOTP secret)
    await sequelize.query(`
      ALTER TABLE users 
      ADD COLUMN IF NOT EXISTS two_factor_secret VARCHAR(255);
    `);

    // Add backup_codes column (JSON array of backup codes)
    await sequelize.query(`
      ALTER TABLE users 
      ADD COLUMN IF NOT EXISTS backup_codes TEXT;
    `);

    console.log('✅ 2FA columns added successfully');
  } catch (error) {
    console.error('❌ Error adding 2FA columns:', error);
    throw error;
  }
}

// Run migration if this file is executed directly
if (require.main === module) {
  add2FAColumns()
    .then(() => {
      console.log('Migration completed');
      process.exit(0);
    })
    .catch((error) => {
      console.error('Migration failed:', error);
      process.exit(1);
    });
}

module.exports = add2FAColumns;

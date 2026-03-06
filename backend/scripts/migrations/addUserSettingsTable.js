const { sequelize } = require('../../config/database');

async function createUserSettingsTable() {
  try {
    console.log('Creating user_settings table...');
    
    await sequelize.query(`
      CREATE TABLE IF NOT EXISTS user_settings (
        settings_id SERIAL PRIMARY KEY,
        user_id INTEGER NOT NULL UNIQUE,
        theme VARCHAR(20) NOT NULL DEFAULT 'light',
        email_notifications BOOLEAN NOT NULL DEFAULT true,
        sms_notifications BOOLEAN NOT NULL DEFAULT false,
        activity_updates BOOLEAN NOT NULL DEFAULT true,
        booking_reminders BOOLEAN NOT NULL DEFAULT true,
        created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
        updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
        CONSTRAINT fk_user_settings_user
          FOREIGN KEY (user_id)
          REFERENCES users(id)
          ON DELETE CASCADE
      );
    `);

    await sequelize.query(`
      CREATE INDEX IF NOT EXISTS idx_user_settings_user ON user_settings(user_id);
    `);

    console.log('✅ user_settings table created successfully');
  } catch (error) {
    console.error('❌ Error creating user_settings table:', error);
    throw error;
  }
}

// Run migration if this file is executed directly
if (require.main === module) {
  createUserSettingsTable()
    .then(() => {
      console.log('Migration completed');
      process.exit(0);
    })
    .catch((error) => {
      console.error('Migration failed:', error);
      process.exit(1);
    });
}

module.exports = createUserSettingsTable;

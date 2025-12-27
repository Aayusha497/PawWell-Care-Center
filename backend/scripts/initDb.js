const { sequelize } = require('../config/database');
const { User, EmailVerification, PasswordReset } = require('../models');

/**
 * Script to initialize database tables
 * Run this script to create all tables in the database
 */
const initDatabase = async () => {
  try {
    console.log('🔄 Starting database initialization...');

    // Test connection
    await sequelize.authenticate();
    console.log('✅ Database connection established');

    // Sync all models (create tables)
    await sequelize.sync({ force: false, alter: false });
    console.log('✅ All models synchronized successfully');

    console.log('\n📊 Database tables created:');
    console.log('  - users');
    console.log('  - email_verifications');
    console.log('  - password_resets');

    console.log('\n✨ Database initialization completed successfully!');
    
    process.exit(0);
  } catch (error) {
    console.error('❌ Database initialization failed:', error);
    process.exit(1);
  }
};

// Run initialization
initDatabase();

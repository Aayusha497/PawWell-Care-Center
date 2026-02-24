const { sequelize } = require('../config/database');
const User = require('../models/User');

const addContactName = async () => {
  try {
    await sequelize.authenticate();
    console.log('✅ Connected to database.');

    console.log('🔄 Syncing User model with alter: true...');
    await User.sync({ alter: true });
    
    console.log('✅ User schema updated successfully. emergencyContactName should be added.');
  } catch (error) {
    console.error('❌ Error updating User schema:', error);
  } finally {
    await sequelize.close();
  }
};

addContactName();

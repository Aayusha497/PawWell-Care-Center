const { sequelize } = require('../config/database');

// Import all models
const User = require('./User');
const PasswordReset = require('./PasswordReset');
const Pet = require('./Pet')(sequelize);
const Service = require('./Service')(sequelize);
const Booking = require('./Booking')(sequelize);
const Payment = require('./Payment')(sequelize);
const Receipt = require('./Receipt')(sequelize);
const EmergencyRequest = require('./EmergencyRequest')(sequelize);
const WellnessTimeline = require('./WellnessTimeline')(sequelize);
const PublicForum = require('./PublicForum')(sequelize);
const ActivityLog = require('./ActivityLog')(sequelize);
const Notification = require('./Notification')(sequelize);

// Store all models
const models = {
  User,
  PasswordReset,
  Pet,
  Service,
  Booking,
  Payment,
  Receipt,
  EmergencyRequest,
  WellnessTimeline,
  PublicForum,
  ActivityLog,
  Notification
};

// Set up associations
Object.keys(models).forEach(modelName => {
  if (models[modelName].associate) {
    models[modelName].associate(models);
  }
});

// Original associations (keeping for backward compatibility)
User.hasMany(PasswordReset, {
  foreignKey: 'userId',
  as: 'passwordResets'
});

PasswordReset.belongsTo(User, {
  foreignKey: 'userId',
  as: 'user'
});

// Export all models
module.exports = models;

const { sequelize } = require('../config/database');

// Import all models
const User = require('./User');
const PasswordReset = require('./PasswordReset');
const EmailVerification = require('./EmailVerification');
const PendingRegistration = require('./PendingRegistration');
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
const ContactMessage = require('./ContactMessage')(sequelize);
const Review = require('./Review')(sequelize);
const ChatConversation = require('./ChatConversation')(sequelize);
const ChatMessage = require('./ChatMessage')(sequelize);
const UserSettings = require('./UserSettings');

// Store all models
const models = {
  User,
  PasswordReset,
  EmailVerification,
  PendingRegistration,
  Pet,
  Service,
  Booking,
  Payment,
  Receipt,
  EmergencyRequest,
  WellnessTimeline,
  PublicForum,
  ActivityLog,
  Notification,
  ContactMessage,
  Review,
  ChatConversation,
  ChatMessage,
  UserSettings
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

// Email verification associations
User.hasMany(EmailVerification, {
  foreignKey: 'userId',
  as: 'emailVerifications'
});

EmailVerification.belongsTo(User, {
  foreignKey: 'userId',
  as: 'user'
});

// Chat model associations
User.hasMany(ChatConversation, {
  foreignKey: 'user_id',
  as: 'chatConversations'
});

ChatConversation.belongsTo(User, {
  foreignKey: 'user_id',
  as: 'user'
});

ChatConversation.hasMany(ChatMessage, {
  foreignKey: 'conversation_id',
  as: 'messages'
});

ChatMessage.belongsTo(ChatConversation, {
  foreignKey: 'conversation_id',
  as: 'conversation'
});

// UserSettings associations
User.hasOne(UserSettings, {
  foreignKey: 'userId',
  as: 'settings'
});

UserSettings.belongsTo(User, {
  foreignKey: 'userId',
  as: 'user'
});

// User -> Pet association
User.hasMany(Pet, {
  foreignKey: 'user_id',
  as: 'pets'
});

// Export all models
module.exports = models;

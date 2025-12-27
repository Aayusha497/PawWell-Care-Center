const User = require('./User');
const PasswordReset = require('./PasswordReset');

// Define associations
User.hasMany(PasswordReset, {
  foreignKey: 'userId',
  as: 'passwordResets'
});

PasswordReset.belongsTo(User, {
  foreignKey: 'userId',
  as: 'user'
});

module.exports = {
  User,
  PasswordReset
};

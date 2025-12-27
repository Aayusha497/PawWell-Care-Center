const { DataTypes } = require('sequelize');
const { sequelize } = require('../config/database');
const bcrypt = require('bcryptjs');

const User = sequelize.define('User', {
  id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true
  },
  email: {
    type: DataTypes.STRING,
    allowNull: false,
    unique: true,
    validate: {
      isEmail: true
    },
    set(value) {
      this.setDataValue('email', value.toLowerCase().trim());
    }
  },
  password: {
    type: DataTypes.STRING,
    allowNull: false
  },
  firstName: {
    type: DataTypes.STRING(150),
    allowNull: false,
    field: 'first_name'
  },
  lastName: {
    type: DataTypes.STRING(150),
    allowNull: false,
    field: 'last_name'
  },
  phoneNumber: {
    type: DataTypes.STRING(20),
    allowNull: true,
    field: 'phone_number'
  },
  userType: {
    type: DataTypes.ENUM('pet_owner', 'admin', 'staff'),
    defaultValue: 'pet_owner',
    allowNull: false,
    field: 'user_type'
  },
  profilePicture: {
    type: DataTypes.STRING,
    allowNull: true,
    field: 'profile_picture'
  },
  emailVerified: {
    type: DataTypes.BOOLEAN,
    defaultValue: false,
    field: 'email_verified'
  },
  isActive: {
    type: DataTypes.BOOLEAN,
    defaultValue: true,
    field: 'is_active'
  },
  isStaff: {
    type: DataTypes.BOOLEAN,
    defaultValue: false,
    field: 'is_staff'
  },
  isSuperuser: {
    type: DataTypes.BOOLEAN,
    defaultValue: false,
    field: 'is_superuser'
  },
  dateJoined: {
    type: DataTypes.DATE,
    defaultValue: DataTypes.NOW,
    field: 'date_joined'
  },
  lastLogin: {
    type: DataTypes.DATE,
    allowNull: true,
    field: 'last_login'
  }
}, {
  tableName: 'users',
  timestamps: true,
  createdAt: 'dateJoined',
  updatedAt: false,
  hooks: {
    beforeCreate: async (user) => {
      if (user.password) {
        const salt = await bcrypt.genSalt(10);
        user.password = await bcrypt.hash(user.password, salt);
      }
    },
    beforeUpdate: async (user) => {
      if (user.changed('password')) {
        const salt = await bcrypt.genSalt(10);
        user.password = await bcrypt.hash(user.password, salt);
      }
    }
  }
});

// Instance methods
User.prototype.checkPassword = async function(password) {
  return await bcrypt.compare(password, this.password);
};

User.prototype.getFullName = function() {
  return `${this.firstName} ${this.lastName}`.trim();
};

User.prototype.getShortName = function() {
  return this.firstName;
};

User.prototype.toJSON = function() {
  const values = { ...this.get() };
  delete values.password;
  return values;
};

module.exports = User;

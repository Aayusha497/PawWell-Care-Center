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
    field: 'first_name',
    validate: {
      notEmpty: {
        msg: 'First name is required'
      },
      len: {
        args: [2, 150],
        msg: 'First name must be between 2 and 150 characters'
      },
      isValidName(value) {
        // Check for numbers
        if (/\d/.test(value)) {
          throw new Error('First name cannot contain numbers');
        }
        // Check for special characters
        if (!/^[A-Za-z]+$/.test(value)) {
          throw new Error('First name can only contain letters');
        }
      }
    }
  },
  lastName: {
    type: DataTypes.STRING(150),
    allowNull: false,
    field: 'last_name',
    validate: {
      notEmpty: {
        msg: 'Last name is required'
      },
      len: {
        args: [2, 150],
        msg: 'Last name must be between 2 and 150 characters'
      },
      isValidName(value) {
        // Check for numbers
        if (/\d/.test(value)) {
          throw new Error('Last name cannot contain numbers');
        }
        // Check for special characters
        if (!/^[A-Za-z]+$/.test(value)) {
          throw new Error('Last name can only contain letters');
        }
      }
    }
  },
  phoneNumber: {
    type: DataTypes.STRING(20),
    allowNull: true,
    field: 'phone_number',
    validate: {
      isValidPhone(value) {
        // Only validate if value is provided
        if (value) {
          // Must be exactly 10 digits, no letters or symbols
          if (!/^\d{10}$/.test(value)) {
            throw new Error('Phone number must be exactly 10 digits with no letters or symbols');
          }
        }
      }
    }
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
  address: {
    type: DataTypes.STRING(255),
    allowNull: true,
    field: 'address'
  },
  city: {
    type: DataTypes.STRING(100),
    allowNull: true,
    field: 'city',
    validate: {
      isValidCity(value) {
        // Only validate if value is provided
        if (value) {
          if (!/^[A-Za-z\s]+$/.test(value)) {
            throw new Error('City can only contain letters (A–Z), no numbers or symbols allowed');
          }
        }
      }
    }
  },
  emergencyContactName: {
    type: DataTypes.STRING(100),
    allowNull: true,
    field: 'emergency_contact_name',
    validate: {
      isValidName(value) {
        // Only validate if value is provided
        if (value) {
          if (!/^[A-Za-z\s]+$/.test(value)) {
            throw new Error('Emergency Contact Name can only contain letters (A–Z), no numbers or symbols allowed');
          }
        }
      }
    }
  },
  emergencyContactNumber: {
    type: DataTypes.STRING(20),
    allowNull: true,
    field: 'emergency_contact_number',
    validate: {
      isValidPhoneNumber(value) {
        // Only validate if value is provided
        if (value) {
          if (!/^\d{10}$/.test(value)) {
            throw new Error('Emergency Contact Number must be exactly 10 digits with no letters or symbols');
          }
        }
      }
    }
  },
  isProfileComplete: {
    type: DataTypes.BOOLEAN,
    defaultValue: false,
    field: 'is_profile_complete'
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
  },
  twoFactorEnabled: {
    type: DataTypes.BOOLEAN,
    defaultValue: false,
    field: 'two_factor_enabled'
  },
  twoFactorSecret: {
    type: DataTypes.STRING(255),
    allowNull: true,
    field: 'two_factor_secret'
  },
  backupCodes: {
    type: DataTypes.TEXT,
    allowNull: true,
    field: 'backup_codes',
    get() {
      const rawValue = this.getDataValue('backupCodes');
      return rawValue ? JSON.parse(rawValue) : null;
    },
    set(value) {
      this.setDataValue('backupCodes', value ? JSON.stringify(value) : null);
    }
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
  delete values.twoFactorSecret; // Don't expose secret
  delete values.backupCodes; // Don't expose backup codes
  // Add fullName as a virtual field for easier frontend access
  values.fullName = this.getFullName();
  return values;
};

module.exports = User;

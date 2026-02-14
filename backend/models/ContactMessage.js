/**
 * Contact Message Model
 * 
 * Stores contact form submissions for admin review
 */

const { DataTypes } = require('sequelize');

module.exports = (sequelize) => {
  const ContactMessage = sequelize.define('ContactMessage', {
    contact_id: {
      type: DataTypes.INTEGER,
      primaryKey: true,
      autoIncrement: true,
      field: 'contact_id'
    },
    user_id: {
      type: DataTypes.INTEGER,
      allowNull: true,
      field: 'user_id',
      references: {
        model: 'users',
        key: 'id'
      }
    },
    full_name: {
      type: DataTypes.STRING(150),
      allowNull: false,
      field: 'full_name'
    },
    email: {
      type: DataTypes.STRING(255),
      allowNull: false,
      field: 'email'
    },
    phone_number: {
      type: DataTypes.STRING(50),
      allowNull: false,
      field: 'phone_number'
    },
    location: {
      type: DataTypes.STRING(255),
      allowNull: false,
      field: 'location'
    },
    subject: {
      type: DataTypes.STRING(255),
      allowNull: false,
      field: 'subject'
    },
    message: {
      type: DataTypes.TEXT,
      allowNull: false,
      field: 'message'
    },
    status: {
      type: DataTypes.ENUM('unread', 'read'),
      allowNull: false,
      defaultValue: 'unread',
      field: 'status'
    }
  }, {
    tableName: 'contact_messages',
    timestamps: true,
    underscored: true,
    createdAt: 'created_at',
    updatedAt: 'updated_at'
  });

  ContactMessage.associate = (models) => {
    ContactMessage.belongsTo(models.User, {
      foreignKey: 'user_id',
      as: 'user'
    });
  };

  return ContactMessage;
};

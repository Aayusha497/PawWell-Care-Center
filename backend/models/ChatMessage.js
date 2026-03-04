/**
 * ChatMessage Model
 * Stores individual chatbot messages
 */

const { DataTypes } = require('sequelize');

module.exports = (sequelize) => {
  const ChatMessage = sequelize.define('ChatMessage', {
    message_id: {
      type: DataTypes.INTEGER,
      primaryKey: true,
      autoIncrement: true,
      field: 'message_id'
    },
    conversation_id: {
      type: DataTypes.UUID,
      allowNull: false,
      field: 'conversation_id',
      references: {
        model: 'chat_conversations',
        key: 'conversation_id'
      },
      onDelete: 'CASCADE'
    },
    role: {
      type: DataTypes.STRING(20),
      allowNull: false,
      field: 'role',
      validate: {
        isIn: [['user', 'assistant', 'bot']]
      }
    },
    content: {
      type: DataTypes.TEXT,
      allowNull: false,
      field: 'content'
    },
    created_at: {
      type: DataTypes.DATE,
      defaultValue: DataTypes.NOW,
      field: 'created_at'
    }
  }, {
    tableName: 'chat_messages',
    timestamps: true,
    createdAt: 'created_at',
    updatedAt: false,
    underscored: true
  });

  return ChatMessage;
};

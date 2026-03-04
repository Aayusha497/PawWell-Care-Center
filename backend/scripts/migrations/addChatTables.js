/**
 * Add Chat Conversations and Messages Tables Migration
 * 
 * Creates tables for storing chatbot conversation history
 */

const { sequelize } = require('../../config/database');
const { DataTypes } = require('sequelize');

async function up() {
  const queryInterface = sequelize.getQueryInterface();

  console.log('Creating chat_conversations table...');

  await queryInterface.createTable('chat_conversations', {
    conversation_id: {
      type: DataTypes.UUID,
      defaultValue: DataTypes.UUIDV4,
      primaryKey: true,
    },
    user_id: {
      type: DataTypes.INTEGER,
      allowNull: false,
      references: {
        model: 'users',
        key: 'id',
      },
      onDelete: 'CASCADE',
    },
    title: {
      type: DataTypes.STRING(255),
      allowNull: true,
    },
    created_at: {
      type: DataTypes.DATE,
      allowNull: false,
      defaultValue: DataTypes.NOW,
    },
    updated_at: {
      type: DataTypes.DATE,
      allowNull: false,
      defaultValue: DataTypes.NOW,
    },
    last_message_at: {
      type: DataTypes.DATE,
      allowNull: false,
      defaultValue: DataTypes.NOW,
    },
  });

  console.log('Creating indexes for chat_conversations...');
  
  await queryInterface.addIndex('chat_conversations', ['user_id'], {
    name: 'idx_chat_conversations_user',
  });
  
  await queryInterface.addIndex('chat_conversations', ['user_id', 'last_message_at'], {
    name: 'idx_chat_conversations_user_last_message',
  });

  console.log('Creating chat_messages table...');

  await queryInterface.createTable('chat_messages', {
    message_id: {
      type: DataTypes.INTEGER,
      primaryKey: true,
      autoIncrement: true,
    },
    conversation_id: {
      type: DataTypes.UUID,
      allowNull: false,
      references: {
        model: 'chat_conversations',
        key: 'conversation_id',
      },
      onDelete: 'CASCADE',
    },
    role: {
      type: DataTypes.STRING(20),
      allowNull: false,
    },
    content: {
      type: DataTypes.TEXT,
      allowNull: false,
    },
    created_at: {
      type: DataTypes.DATE,
      allowNull: false,
      defaultValue: DataTypes.NOW,
    },
  });

  console.log('Creating indexes for chat_messages...');
  
  await queryInterface.addIndex('chat_messages', ['conversation_id'], {
    name: 'idx_chat_messages_conversation',
  });
  
  await queryInterface.addIndex('chat_messages', ['conversation_id', 'created_at'], {
    name: 'idx_chat_messages_conversation_created',
  });

  console.log('Chat tables created successfully!');
}

async function down() {
  const queryInterface = sequelize.getQueryInterface();

  console.log('Dropping chat_messages table...');
  await queryInterface.dropTable('chat_messages');

  console.log('Dropping chat_conversations table...');
  await queryInterface.dropTable('chat_conversations');

  console.log('Chat tables dropped successfully!');
}

module.exports = { up, down };

// Run migration if called directly
if (require.main === module) {
  up()
    .then(() => {
      console.log('✅ Migration completed successfully');
      process.exit(0);
    })
    .catch((error) => {
      console.error('❌ Migration failed:', error);
      process.exit(1);
    });
}

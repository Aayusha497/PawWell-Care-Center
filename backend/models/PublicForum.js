/**
 * Public Forum Model
 * 
 * Represents public forum posts
 */

const { DataTypes } = require('sequelize');

module.exports = (sequelize) => {
  const PublicForum = sequelize.define('PublicForum', {
    forum_id: {
      type: DataTypes.INTEGER,
      primaryKey: true,
      autoIncrement: true,
      field: 'forum_id'
    },
    user_id: {
      type: DataTypes.INTEGER,
      allowNull: false,
      field: 'user_id',
      references: {
        model: 'users',
        key: 'id'
      }
    },
    title: {
      type: DataTypes.STRING(255),
      allowNull: false
    },
    content: {
      type: DataTypes.TEXT,
      allowNull: false
    },
    post_date: {
      type: DataTypes.DATE,
      allowNull: false,
      defaultValue: DataTypes.NOW,
      field: 'post_date'
    },
    likes: {
      type: DataTypes.INTEGER,
      allowNull: false,
      defaultValue: 0
    }
  }, {
    tableName: 'public_forum',
    timestamps: true,
    underscored: true,
    createdAt: 'created_at',
    updatedAt: 'updated_at'
  });

  PublicForum.associate = (models) => {
    PublicForum.belongsTo(models.User, {
      foreignKey: 'user_id',
      as: 'author'
    });
  };

  return PublicForum;
};

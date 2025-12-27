const { Sequelize } = require('sequelize');
const config = require('./config');

const sequelize = new Sequelize(
  config.database.name,
  config.database.user,
  config.database.password,
  {
    host: config.database.host,
    port: config.database.port,
    dialect: config.database.dialect,
    logging: config.database.logging,
    pool: config.database.pool,
    define: {
      timestamps: true,
      underscored: false,
      freezeTableName: true
    }
  }
);

// Test database connection
const testConnection = async () => {
  try {
    await sequelize.authenticate();
    console.log('✅ Database connection established successfully!');
    console.log(`📊 Database: ${config.database.name}`);
    console.log(`🖥️  Host: ${config.database.host}:${config.database.port}`);
    console.log(`👤 User: ${config.database.user}`);
    console.log(`🔌 Dialect: ${config.database.dialect}`);
    return true;
  } catch (error) {
    console.error('❌ Unable to connect to the database!');
    console.error(`📊 Database: ${config.database.name}`);
    console.error(`🖥️  Host: ${config.database.host}:${config.database.port}`);
    console.error(`👤 User: ${config.database.user}`);
    console.error(`⚠️  Error: ${error.message}`);
    return false;
  }
};

module.exports = { sequelize, testConnection };

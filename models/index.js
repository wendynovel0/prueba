'use strict';

const { Sequelize, DataTypes } = require('sequelize');
const path = require('path');
const process = require('process');

// Configuración de Sequelize
const sequelize = new Sequelize({
  dialect: 'postgres',
  host: process.env.DB_HOST,
  port: process.env.DB_PORT || 5432,
  username: process.env.DB_USER,
  password: process.env.DB_PASS,
  database: process.env.DB_NAME,
  logging: process.env.NODE_ENV === 'development' ? console.log : false,
  dialectOptions: process.env.DB_SSL === 'true' ? {
    ssl: {
      require: true,
      rejectUnauthorized: false
    }
  } : {},
  define: {
    underscored: true,
    timestamps: true,
    createdAt: 'created_at',
    updatedAt: 'updated_at'
  }
});

// Cargar modelos
const models = {
  User: require('./user')(sequelize, DataTypes),
  Brand: require('./brand')(sequelize, DataTypes),
  Product: require('./product')(sequelize, DataTypes),
  ActionLog: require('./actionlog')(sequelize, DataTypes)
};

// Establecer relaciones
Object.values(models).forEach(model => {
  if (model.associate) {
    model.associate(models);
  }
});

// Exportar todo
module.exports = {
  ...models,
  sequelize,
  Sequelize,
  async initialize() {
    try {
      await this.authenticate();
      await this.syncModels();
      return true;
    } catch (error) {
      console.error('Database initialization failed:', error);
      return false;
    }
  },
  async authenticate() {
    try {
      await sequelize.authenticate();
      console.log('✅ Database connection established');
      return true;
    } catch (error) {
      console.error('❌ Database connection failed:', error);
      return false;
    }
  },
  async syncModels(options = { alter: true, force: false }) {
    try {
      await sequelize.sync(options);
      console.log('🔄 Database models synchronized');
      return true;
    } catch (error) {
      console.error('❌ Model synchronization failed:', error);
      return false;
    }
  }
};
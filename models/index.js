'use strict';

const { Sequelize, DataTypes } = require('sequelize');
const path = require('path');
const process = require('process');

// Configuración de Sequelize para Neon.tech
const sequelize = new Sequelize(process.env.DATABASE_URL, {
  dialect: 'postgres',
  logging: process.env.NODE_ENV === 'development' ? console.log : false,
  dialectOptions: {
    ssl: { // Neon.tech requiere SSL
      require: true,
      rejectUnauthorized: false // Necesario para evitar errores de certificado
    }
  },
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
      console.log('✅ Conexión a Neon.tech establecida');
      return true;
    } catch (error) {
      console.error('❌ Error de conexión a Neon.tech:', error);
      return false;
    }
  },
  async syncModels(options = { alter: true, force: false }) {
    try {
      await sequelize.sync(options);
      console.log('🔄 Modelos sincronizados con Neon.tech');
      return true;
    } catch (error) {
      console.error('❌ Error al sincronizar modelos:', error);
      return false;
    }
  }
};
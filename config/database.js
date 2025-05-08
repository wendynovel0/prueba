require('dotenv').config();
const { Sequelize, DataTypes } = require('sequelize');

const sequelize = new Sequelize(
  process.env.DB_NAME,
  process.env.DB_USER,
  process.env.DB_PASSWORD,
  {
    host: process.env.DB_HOST,
    dialect: 'postgres',
    logging: process.env.NODE_ENV === 'development' ? console.log : false,
    define: {
      timestamps: true,
      underscored: true,
      paranoid: true
    },
    pool: {
      max: 5,
      min: 0,
      acquire: 30000,
      idle: 10000
    }
  }
);

const testConnection = async () => {
  try {
    await sequelize.authenticate();
    console.log('✅ Conexión a PostgreSQL establecida correctamente');
    return true;
  } catch (error) {
    console.error('❌ Error al conectar a PostgreSQL:', error);
    return false;
  }
};

const defineModels = () => {
  const models = {
    User: require('../models/user')(sequelize, DataTypes),
    Brand: require('../models/brand')(sequelize, DataTypes),
    Product: require('../models/product')(sequelize, DataTypes),
    ActionLog: require('../models/actionlog')(sequelize, DataTypes)
  };

  Object.values(models).forEach(model => {
    if (model.associate) {
      model.associate(models);
    }
  });

  return models;
};

const syncModels = async (options = { alter: true, force: false }) => {
  try {
    await sequelize.sync(options);
    console.log('🔄 Modelos sincronizados correctamente');
    return true;
  } catch (error) {
    console.error('❌ Error al sincronizar modelos:', error);
    return false;
  }
};

const { User, Brand, Product, ActionLog } = defineModels();

module.exports = {
  sequelize,
  testConnection,
  syncModels,
  User,
  Brand,
  Product,
  ActionLog
};
// models/product.model.js
'use strict';

module.exports = (sequelize, DataTypes) => {
  const Product = sequelize.define('products', {
    product_id: {
      type: DataTypes.INTEGER,
      primaryKey: true,
      autoIncrement: true,
      field: 'product_id'
    },
    code: {
      type: DataTypes.STRING(50),
      allowNull: false,
      unique: true,
      field: 'code'
    },
    name: {
      type: DataTypes.STRING(100),
      allowNull: false,
      field: 'name'
    },
    description: {
      type: DataTypes.TEXT,
      field: 'description'
    },
    price: {
      type: DataTypes.DECIMAL(10, 2),
      allowNull: false,
      field: 'price'
    },
    brand_id: {
      type: DataTypes.INTEGER,
      allowNull: false,
      field: 'brand_id'
    },
    is_active: {
      type: DataTypes.BOOLEAN,
      defaultValue: true,
      field: 'is_active'
    },
    created_at: {
      type: DataTypes.DATE,
      defaultValue: DataTypes.NOW,
      field: 'created_at'
    },
    updated_at: {
      type: DataTypes.DATE,
      defaultValue: DataTypes.NOW,
      field: 'updated_at'
    }
  }, {
    tableName: 'products',
    timestamps: false,
    hooks: {
      beforeUpdate: (product) => {
        product.updated_at = new Date();
      }
    }
  });

  Product.associate = (models) => {
    Product.belongsTo(models.Brand, {
      foreignKey: 'brand_id',
      as: 'brand'
    });
  };

  return Product;
};
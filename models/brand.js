// models/brand.js
module.exports = (sequelize, DataTypes) => {
  const Brand = sequelize.define('brands', {
    brand_id: {
      type: DataTypes.INTEGER,
      primaryKey: true,
      autoIncrement: true
    },
    name: {
      type: DataTypes.STRING(100),
      allowNull: false
    },
    description: {
      type: DataTypes.TEXT
    },
    is_active: {
      type: DataTypes.BOOLEAN,
      defaultValue: true
    },
    created_at: {
      type: DataTypes.DATE,
      defaultValue: DataTypes.NOW
    },
    updated_at: {
      type: DataTypes.DATE,
      defaultValue: DataTypes.NOW
    }
  }, {
    tableName: 'brands',
    timestamps: false
  });

  Brand.associate = (models) => {
    Brand.hasMany(models.Product, {
      foreignKey: 'brand_id',
      as: 'products'
    });
  };

  return Brand;
};
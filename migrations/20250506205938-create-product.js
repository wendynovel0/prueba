'use strict';
/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.createTable('Products', {
      id: {
        allowNull: false,
        autoIncrement: true,
        primaryKey: true,
        type: Sequelize.INTEGER
      },
      code: {
        type: Sequelize.STRING,
        allowNull: false,
        unique: true // Esto reemplaza el addConstraint posterior
      },
      name: {
        type: Sequelize.STRING,
        allowNull: false
      },
      description: {
        type: Sequelize.TEXT,
        allowNull: true
      },
      price: {
        type: Sequelize.DECIMAL(10, 2), // Especifica precisión
        allowNull: false
      },
      brand_id: {
        type: Sequelize.INTEGER,
        allowNull: false,
        references: { // Definición de FK directamente
          model: 'Brands',
          key: 'id'
        },
        onDelete: 'CASCADE',
        onUpdate: 'CASCADE'
      },
      is_active: {
        type: Sequelize.BOOLEAN,
        defaultValue: true
      },
      created_at: {
        type: Sequelize.DATE,
        defaultValue: Sequelize.literal('CURRENT_TIMESTAMP')
      },
      updated_at: {
        type: Sequelize.DATE,
        defaultValue: Sequelize.literal('CURRENT_TIMESTAMP')
      }
      // Eliminados createdAt y updatedAt duplicados
    });

    // Si prefieres usar addConstraint en lugar de las opciones inline:
    /*
    await queryInterface.addConstraint('Products', {
      fields: ['code'],
      type: 'unique',
      name: 'unique_product_code_constraint'
    });
    
    await queryInterface.addConstraint('Products', {
      fields: ['brand_id'],
      type: 'foreign key',
      name: 'fk_brand_id',
      references: {
        table: 'Brands',
        field: 'id'
      },
      onDelete: 'CASCADE',
      onUpdate: 'CASCADE'
    });
    */
  },

  async down(queryInterface, Sequelize) {
    await queryInterface.dropTable('Products');
  }
};
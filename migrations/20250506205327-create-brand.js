'use strict';
/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.createTable('Brands', {
      id: {
        allowNull: false,
        autoIncrement: true,
        primaryKey: true,
        type: Sequelize.INTEGER
      },
      name: {
        type: Sequelize.STRING,
        allowNull: false 
      },
      description: {
        type: Sequelize.TEXT,
        allowNull: true 
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
    });

    await queryInterface.addIndex('Brands', ['name']); 
  },
  
  async down(queryInterface, Sequelize) {
    await queryInterface.dropTable('Brands');
  }
};
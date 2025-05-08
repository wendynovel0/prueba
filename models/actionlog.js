// models/actionLog.model.js
module.exports = (sequelize, DataTypes) => {
  const ActionLog = sequelize.define('action_logs', {
    log_id: {
      type: DataTypes.INTEGER,
      primaryKey: true,
      autoIncrement: true
    },
    user_id: {
      type: DataTypes.INTEGER,
      allowNull: false
    },
    action_type: {
      type: DataTypes.STRING(50),
      allowNull: false
    },
    table_affected: {
      type: DataTypes.STRING(50),
      allowNull: false
    },
    record_id: {
      type: DataTypes.INTEGER,
      allowNull: false
    },
    old_values: {
      type: DataTypes.JSON
    },
    new_values: {
      type: DataTypes.JSON
    },
    ip_address: {
      type: DataTypes.STRING(45)
    }
  }, {
    tableName: 'action_logs',
    timestamps: true,
    createdAt: 'action_timestamp',
    updatedAt: false
  });

  ActionLog.associate = (models) => {
    ActionLog.belongsTo(models.User, {
      foreignKey: 'user_id',
      as: 'user'
    });
  };

  return ActionLog;
};
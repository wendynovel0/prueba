const bcrypt = require('bcrypt');

module.exports = (sequelize, DataTypes) => {
  const User = sequelize.define('users', {
    user_id: {
      type: DataTypes.INTEGER,
      primaryKey: true,
      autoIncrement: true
    },
    username: {
      type: DataTypes.STRING,
      allowNull: false
    },
    password_hash: {
      type: DataTypes.STRING,
      allowNull: false,
      set(value) {
        if (this.isNewRecord || this.changed('password_hash')) {
          const salt = bcrypt.genSaltSync(10);
          this.setDataValue('password_hash', bcrypt.hashSync(value, salt));
        }
      }
    },
    email: {
      type: DataTypes.STRING,
      allowNull: false,
      unique: true,
      validate: { isEmail: true }
    },
    is_active: {
      type: DataTypes.BOOLEAN,
      defaultValue: true
    }
  }, {
    tableName: 'users',
    timestamps: true
  });

  User.prototype.validPassword = async function(password) {
    if (this.password_hash.startsWith('$2b$')) {
      return await bcrypt.compare(password, this.password_hash);
    }
    return password === this.password_hash;
  };

  return User;
};
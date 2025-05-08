const jwt = require('jsonwebtoken');
const { User } = require('../models');

module.exports = {
  login: async (req, res, next) => {
    try {
      const { email, password_hash } = req.body;
      
      const user = await User.findOne({ 
        where: { email },
        attributes: ['user_id', 'username', 'password_hash', 'email', 'is_active']
      });

      if (!user || !user.is_active || !(await user.validPassword(password_hash))) {
        return res.status(401).json({ 
          error: 'Credenciales inválidas o cuenta inactiva' 
        });
      }

      const token = jwt.sign(
        {
          user_id: user.user_id,
          username: user.username
        },
        process.env.JWT_SECRET,
        { expiresIn: process.env.JWT_EXPIRES_IN || '1h' }
      );

      res.json({
        token,
        user: {
          user_id: user.user_id,
          username: user.username,
          email: user.email
        }
      });
    } catch (error) {
      next(error);
    }
  },

  profile: (req, res) => {
    // Eliminamos la referencia a role
    const { user_id, username, email } = req.user;
    res.json({ user_id, username, email });
  },

  refreshToken: (req, res) => {
    const newToken = jwt.sign(
      {
        user_id: req.user.user_id,
        username: req.user.username
      },
      process.env.JWT_SECRET,
      { expiresIn: process.env.JWT_EXPIRES_IN || '1h' }
    );
    
    res.json({ token: newToken });
  }
};
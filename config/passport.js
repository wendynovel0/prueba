const passport = require('passport');
const { Strategy: JwtStrategy, ExtractJwt } = require('passport-jwt');
const { User } = require('../models');
const jwtSecret = process.env.JWT_SECRET || 'tu_secreto_super_seguro';

const jwtOptions = {
  jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
  secretOrKey: jwtSecret
};

passport.use(new JwtStrategy(jwtOptions, async (jwtPayload, done) => {
  try {
    const user = await User.findByPk(jwtPayload.id);
    
    if (!user) {
      return done(null, false);
    }
    
    if (!user.is_active) {
      return done(null, false, { message: 'Usuario desactivado' });
    }

    return done(null, user);
  } catch (error) {
    return done(error, false);
  }
}));

const authenticateJWT = passport.authenticate('jwt', { 
  session: false,
  failWithError: true 
});

const checkRole = (roles) => (req, res, next) => {
  if (!roles.includes(req.user.role)) {
    return res.status(403).json({ error: 'Acceso no autorizado' });
  }
  next();
};

module.exports = {
  passport,
  authenticateJWT,
  checkRole
};
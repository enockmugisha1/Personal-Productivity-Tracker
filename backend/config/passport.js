const passport = require('passport');
const JwtStrategy = require('passport-jwt').Strategy;
const ExtractJwt = require('passport-jwt').ExtractJwt;
// const GoogleStrategy = require('passport-google-oauth20').Strategy; // Removed
const User = require('../models/User');
const admin = require('./firebase-config');

// JWT Strategy
const jwtOptions = {
  jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
  secretOrKey: process.env.JWT_SECRET
};

passport.use(new JwtStrategy(jwtOptions, async (payload, done) => {
  try {
    const user = await User.findById(payload.userId);
    if (user) {
      return done(null, user);
    }
    return done(null, false);
  } catch (error) {
    return done(error, false);
  }
}));

// Google OAuth Strategy - ENTIRE BLOCK REMOVED
// passport.use(new GoogleStrategy({
// ... (all lines of GoogleStrategy removed) ...
//   }
// ));

// Firebase Authentication Middleware
const verifyFirebaseToken = async (idToken) => {
  try {
    const decodedToken = await admin.auth().verifyIdToken(idToken);
    return decodedToken;
  } catch (error) {
    throw new Error('Invalid Firebase token');
  }
};

module.exports = {
  passport,
  verifyFirebaseToken
}; 
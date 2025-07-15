const jwt = require('jsonwebtoken');
const admin = require('../config/firebase-config');
const User = require('../models/User');

const auth = async (req, res, next) => {
  try {
    const token = req.header('Authorization')?.replace('Bearer ', '');
    
    if (!token) {
      return res.status(401).json({ message: 'No authentication token, access denied' });
    }

    let user;

    // Try to verify as Firebase ID token first (for Google sign-in)
    try {
      const decodedToken = await admin.auth().verifyIdToken(token);
      user = await User.findOne({ firebaseUid: decodedToken.uid });
      
      if (!user) {
        return res.status(401).json({ message: 'User not found' });
      }
    } catch (firebaseError) {
      // If Firebase verification fails, try as backend JWT (for email/password login)
      try {
        const decoded = jwt.verify(token, process.env.JWT_SECRET);
        user = await User.findOne({ _id: decoded.userId });
        
        if (!user) {
          throw new Error('User not found');
        }
      } catch (jwtError) {
        return res.status(401).json({ message: 'Token is invalid', error: 'Both Firebase and JWT verification failed' });
      }
    }

    req.user = user._id; // Use user ID for consistency
    req.token = token;
    next();
  } catch (error) {
    res.status(401).json({ message: 'Token is invalid', error: error.message });
  }
};

module.exports = auth;

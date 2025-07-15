const User = require('../models/User');
const admin = require('../config/firebase-config');
const jwt = require('jsonwebtoken');
const bcrypt = require('bcryptjs');

// Register new user
const register = async (req, res) => {
  try {
    const { email, password, displayName } = req.body;

    // Check if user already exists
    const existingUser = await User.findOne({ email });
    if (existingUser) {
      return res.status(400).json({ message: 'User already exists' });
    }

    // Create user in Firebase
    const userRecord = await admin.auth().createUser({
      email,
      password,
      displayName
    });

    // Create user in MongoDB
    const user = new User({
      firebaseUid: userRecord.uid,
      email,
      displayName
    });

    await user.save();

    // Generate JWT token
    const token = jwt.sign(
      { userId: user._id, email: user.email },
      process.env.JWT_SECRET,
      { expiresIn: '24h' }
    );

    res.status(201).json({
      message: 'User created successfully',
      token,
      user: {
        id: user._id,
        email: user.email,
        displayName: user.displayName
      }
    });
  } catch (error) {
    console.error('Registration error:', error);
    res.status(500).json({ message: 'Error creating user', error: error.message });
  }
};

// Login user
const login = async (req, res) => {
  try {
    const { email, password } = req.body;

    // Verify with Firebase
    const userCredential = await admin.auth().getUserByEmail(email);
    
    // Find user in MongoDB
    const user = await User.findOne({ firebaseUid: userCredential.uid });
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    // Update last login
    user.lastLogin = new Date();
    await user.save();

    // Generate JWT token
    const token = jwt.sign(
      { userId: user._id, email: user.email },
      process.env.JWT_SECRET,
      { expiresIn: '24h' }
    );

    res.json({
      message: 'Login successful',
      token,
      user: {
        id: user._id,
        email: user.email,
        displayName: user.displayName
      }
    });
  } catch (error) {
    console.error('Login error:', error);
    res.status(401).json({ message: 'Invalid credentials' });
  }
};

module.exports = {
  register,
  login
}; 
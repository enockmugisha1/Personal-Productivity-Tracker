const express = require('express');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const passport = require('passport');
const User = require('../models/User');
const admin = require('../config/firebase-config');
const router = express.Router();
const { register, login } = require('../controllers/authController');
const auth = require('../middleware/auth');
const { upload, processUpload } = require('../middleware/upload');
const path = require('path');

// Helper function to generate JWT token
const generateToken = (user) => {
  return jwt.sign(
    { userId: user._id, email: user.email },
    process.env.JWT_SECRET,
    { expiresIn: '7d' }
  );
};

// Register new user
router.post('/register', async (req, res) => {
  try {
    const { email, password, displayName } = req.body;

    // Check if user exists
    let user = await User.findOne({ email });
    if (user) {
      return res.status(400).json({ message: 'User already exists' });
    }

    // Create new user
    user = new User({
      email,
      password,
      displayName: displayName || email.split('@')[0]
    });

    await user.save();

    // Generate JWT token
    const authToken = generateToken(user);

    res.status(201).json({
      token: authToken,
      user: {
        id: user._id,
        email: user.email,
        displayName: user.displayName,
        photoURL: user.photoURL
      }
    });
  } catch (error) {
    res.status(500).json({ message: 'Error creating user', error: error.message });
  }
});

// Login with email/password
router.post('/login', async (req, res) => {
  try {
    const { email, password } = req.body;

    // Find user and include password for comparison
    const user = await User.findOne({ email }).select('+password');
    if (!user) {
      return res.status(401).json({ message: 'Invalid credentials' });
    }

    // Check password
    const isMatch = await user.comparePassword(password);
    if (!isMatch) {
      return res.status(401).json({ message: 'Invalid credentials' });
    }

    // Update last login
    user.lastLogin = new Date();
    await user.save();

    // Generate token
    const authToken = generateToken(user);

    res.json({
      token: authToken,
      user: {
        id: user._id,
        email: user.email,
        displayName: user.displayName,
        photoURL: user.photoURL
      }
    });
  } catch (error) {
    res.status(500).json({ message: 'Login error', error: error.message });
  }
});

// Verify Firebase token and create/update user in our database
router.post('/verify-token', async (req, res) => {
  try {
    const { token, firebaseUid, email, displayName, photoURL } = req.body;
    
    console.log('Verifying token for user:', { firebaseUid, email, displayName });
    
    // Validate required fields
    if (!token) {
      return res.status(400).json({ message: 'Token is required' });
    }
    if (!email) {
      return res.status(400).json({ message: 'Email is required' });
    }
    
    // Verify the Firebase token
    const decodedToken = await admin.auth().verifyIdToken(token);
    console.log('Token verified successfully for UID:', decodedToken.uid);
    
    // Check if user exists in our database by firebaseUid or email
    let user = await User.findOne({ 
      $or: [
        { firebaseUid: firebaseUid },
        { email: email }
      ]
    });
    
    if (!user) {
      // Create new user if they don't exist
      console.log('Creating new user for:', email);
      const userData = {
        firebaseUid: decodedToken.uid,
        email: decodedToken.email || email,
        displayName: decodedToken.name || displayName || email.split('@')[0],
        photoURL: decodedToken.picture || photoURL || null,
        isGoogleUser: true
      };
      
      console.log('User data to create:', userData);
      user = new User(userData);
      
      try {
        await user.save();
        console.log('New user created:', user._id);
      } catch (saveError) {
        console.error('User save error:', saveError);
        if (saveError.name === 'ValidationError') {
          const validationErrors = Object.values(saveError.errors).map(err => err.message);
          return res.status(400).json({ 
            message: 'Validation failed', 
            errors: validationErrors 
          });
        }
        throw saveError;
      }
    } else {
      // Update existing user with Firebase UID if not set
      let updated = false;
      if (!user.firebaseUid) {
        user.firebaseUid = decodedToken.uid;
        user.isGoogleUser = true;
        updated = true;
      }
      if (decodedToken.name && user.displayName !== decodedToken.name) {
        user.displayName = decodedToken.name;
        updated = true;
      }
      if (decodedToken.picture && user.photoURL !== decodedToken.picture) {
        user.photoURL = decodedToken.picture;
        updated = true;
      }
      if (updated) {
        await user.save();
        console.log('User updated:', user._id);
      }
    }

    // Update last login
    user.lastLogin = new Date();
    await user.save();

    // Generate backend JWT token
    const authToken = generateToken(user);

    console.log('Authentication successful for user:', user.email);

    res.json({ 
      token: authToken,
      user: {
        id: user._id,
        email: user.email,
        displayName: user.displayName,
        photoURL: user.photoURL,
        settings: user.settings
      }
    });
  } catch (error) {
    console.error('Token verification error:', error);
    
    // Provide more detailed error information
    if (error.code === 'auth/id-token-expired') {
      return res.status(401).json({ message: 'Token expired, please sign in again' });
    } else if (error.code === 'auth/argument-error') {
      return res.status(400).json({ message: 'Invalid token format' });
    }
    
    res.status(401).json({ 
      message: 'Authentication failed', 
      error: process.env.NODE_ENV === 'development' ? error.message : 'Invalid token'
    });
  }
});

// Get current user
router.get('/me', auth, async (req, res) => {
  try {
    const user = await User.findById(req.user._id);
    res.json({
      user: {
        id: user._id,
        email: user.email,
        displayName: user.displayName,
        photoURL: user.photoURL,
        settings: user.settings
      }
    });
  } catch (error) {
    res.status(500).json({ message: 'Error fetching user', error: error.message });
  }
});

// Update user settings
router.patch('/settings', auth, async (req, res) => {
  try {
    const { settings } = req.body;
    const user = await User.findByIdAndUpdate(
      req.user._id,
      { settings },
      { new: true }
    );
    res.json({
      user: {
        id: user._id,
        email: user.email,
        displayName: user.displayName,
        photoURL: user.photoURL,
        settings: user.settings
      }
    });
  } catch (error) {
    res.status(500).json({ message: 'Error updating settings', error: error.message });
  }
});

// Upload profile photo
router.post('/upload-photo', auth, upload.single('photo'), processUpload, async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ message: 'No file uploaded' });
    }

    // Get the file path
    const photoURL = `/uploads/${req.file.filename}`;

    // Update user's photoURL
    const user = await User.findByIdAndUpdate(
      req.user._id,
      { photoURL },
      { new: true }
    );

    res.json({
      message: 'Profile photo updated successfully',
      photoURL: photoURL,
      user: {
        id: user._id,
        email: user.email,
        displayName: user.displayName,
        photoURL: user.photoURL,
        settings: user.settings
      }
    });
  } catch (error) {
    console.error('Photo upload error:', error);
    res.status(500).json({ message: 'Error uploading photo', error: error.message });
  }
});

// Note: Static file serving is handled in server.js

module.exports = router;
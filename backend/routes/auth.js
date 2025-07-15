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
    const { token, firebaseUid } = req.body;
    
    // Verify the Firebase token
    const decodedToken = await admin.auth().verifyIdToken(token);
    
    // Check if user exists in our database
    let user = await User.findOne({ firebaseUid: firebaseUid });
    
    if (!user) {
      // Create new user if they don't exist
      user = new User({
        firebaseUid: decodedToken.uid,
        email: decodedToken.email,
        displayName: decodedToken.name || decodedToken.email.split('@')[0],
        photoURL: decodedToken.picture || null
      });
      await user.save();
    } else {
      // Optionally: Update existing user fields if they differ from Firebase
      // For example, if displayName or photoURL might change in Firebase
      let updated = false;
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
      }
    }

    // Generate backend JWT token
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
    console.error('Token verification error:', error);
    res.status(401).json({ message: 'Invalid token' });
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

// Serve uploaded files with caching headers
router.use('/uploads', (req, res, next) => {
  // Set cache control headers for images
  res.setHeader('Cache-Control', 'public, max-age=31536000'); // Cache for 1 year
  res.setHeader('Expires', new Date(Date.now() + 31536000000).toUTCString());
  next();
}, express.static(path.join(__dirname, '../uploads')));

module.exports = router;
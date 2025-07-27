const admin = require('firebase-admin');
const path = require('path');
const fs = require('fs');

// Try to load service account from different sources
let serviceAccount;
let firebaseInitialized = false;

try {
  // First, try to load from file
  const serviceAccountPath = path.join(__dirname, 'serviceAccount.json');
  if (fs.existsSync(serviceAccountPath)) {
    serviceAccount = require(serviceAccountPath);
    console.log('🔥 Firebase: Using service account from file');
  } else {
    // If file doesn't exist, use environment variables
    if (process.env.FIREBASE_SERVICE_ACCOUNT_KEY) {
      serviceAccount = JSON.parse(process.env.FIREBASE_SERVICE_ACCOUNT_KEY);
      console.log('🔥 Firebase: Using service account from environment variable');
    } else {
      console.warn('⚠️  Firebase: No service account found - some features may not work');
      console.log('💡 To enable Firebase features:');
      console.log('   1. Add serviceAccount.json file to config/ directory, OR');
      console.log('   2. Set FIREBASE_SERVICE_ACCOUNT_KEY environment variable');
      
      // Export a dummy admin object to prevent crashes
      module.exports = {
        auth: () => ({ verifyIdToken: () => Promise.reject(new Error('Firebase not configured')) }),
        firestore: () => ({ collection: () => ({ doc: () => ({ get: () => Promise.reject(new Error('Firebase not configured')) }) }) })
      };
      return;
    }
  }

  // Initialize Firebase Admin SDK
  if (serviceAccount && !admin.apps.length) {
    admin.initializeApp({
      credential: admin.credential.cert(serviceAccount),
      // You can add other configurations here if needed
      // databaseURL: "https://your-project-id.firebaseio.com"
    });
    firebaseInitialized = true;
    console.log('✅ Firebase Admin SDK initialized successfully');
  }
} catch (error) {
  console.error('❌ Firebase initialization error:', error.message);
  console.log('💡 Firebase features will be disabled');
  
  // Export a dummy admin object to prevent crashes
  module.exports = {
    auth: () => ({ verifyIdToken: () => Promise.reject(new Error('Firebase not configured')) }),
    firestore: () => ({ collection: () => ({ doc: () => ({ get: () => Promise.reject(new Error('Firebase not configured')) }) }) })
  };
  return;
}

module.exports = admin;

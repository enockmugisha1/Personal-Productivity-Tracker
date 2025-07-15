const admin = require('firebase-admin');
const path = require('path');

// Initialize Firebase Admin with service account
const serviceAccount = require('./serviceAccount.json');

// Initialize Firebase Admin SDK
admin.initializeApp({
  credential: admin.credential.cert(serviceAccount),
  // You can add other configurations here if needed
  // databaseURL: "https://your-project-id.firebaseio.com"
});

module.exports = admin; 